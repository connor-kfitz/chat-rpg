import { WebSocketServer, type WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import type { ClientMessage, ServerMessage } from "@fantasy-grid/shared";
import { rooms } from "./rooms.js";

const PORT = Number(process.env.PORT ?? 8080);
const wss = new WebSocketServer({ port: PORT });

interface ConnectionState {
  playerId: string;
  roomId: string;
}

const connections = new Map<WebSocket, ConnectionState>();

function send(ws: WebSocket, message: ServerMessage) {
  ws.send(JSON.stringify(message));
}

function broadcast(roomId: string, message: ServerMessage, exclude?: WebSocket) {
  for (const [socket, state] of connections) {
    if (state.roomId === roomId && socket !== exclude && socket.readyState === socket.OPEN) {
      send(socket, message);
    }
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return; // ignore malformed frames
    }

    switch (msg.type) {
      case "join_room": {
        const room = rooms.get(msg.roomId);
        if (!room) {
          send(ws, { type: "error", code: "ROOM_FULL", message: "Unknown room" });
          return;
        }
        if (room.isFull()) {
          send(ws, { type: "error", code: "ROOM_FULL", message: "Server is full" });
          return;
        }
        if (room.isNameTaken(msg.displayName)) {
          send(ws, { type: "error", code: "NAME_TAKEN", message: "Name already in use" });
          return;
        }

        const playerId = randomUUID();
        const player = room.addPlayer(playerId, msg.displayName, msg.characterClass);
        connections.set(ws, { playerId, roomId: room.id });

        send(ws, { type: "join_ack", playerId, room: room.snapshot() });
        broadcast(room.id, { type: "player_joined", player }, ws);
        break;
      }

      case "move": {
        const state = connections.get(ws);
        if (!state) return;
        const room = rooms.get(state.roomId);
        if (!room) return;

        const updated = room.tryMove(state.playerId, msg.direction);
        if (!updated) return; // silently drop rejected/cooldown moves

        broadcast(room.id, {
          type: "player_moved",
          playerId: updated.id,
          position: updated.position,
          facing: updated.facing,
        });
        break;
      }

      case "leave_room": {
        disconnect(ws);
        break;
      }
    }
  });

  ws.on("close", () => disconnect(ws));
});

function disconnect(ws: WebSocket) {
  // TODO(spec 02, Reconnect Handling): this removes the player immediately.
  // The spec calls for a 60s grace period before freeing the slot, which also
  // needs a `join_room` protocol extension to resume an existing playerId.
  // Deferred until reconnect flow is designed.
  const state = connections.get(ws);
  if (!state) return;
  const room = rooms.get(state.roomId);
  room?.removePlayer(state.playerId);
  connections.delete(ws);
  if (room) broadcast(room.id, { type: "player_left", playerId: state.playerId });
}

console.log(`fantasy-grid server listening on ws://localhost:${PORT}`);
