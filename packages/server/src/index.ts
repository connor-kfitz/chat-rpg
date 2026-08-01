import { WebSocketServer, type WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { ClientMessage, ServerMessage } from "@fantasy-grid/shared";
import { rooms } from "./rooms.js";

const PORT = Number(process.env.PORT ?? 8080);
const CLIENT_DIST = resolve(dirname(fileURLToPath(import.meta.url)), "../../client/dist");

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".map": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2"
}

async function serveStatic(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (!existsSync(CLIENT_DIST)) {
    res.writeHead(503, { "Content-Type": "text/plain" });
    res.end("Client build not found. Run `npm run build:client` first.");
    return;
  }

  const requestPath = (req.url ?? "/").split("?")[0];
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const filePath = join(CLIENT_DIST, relativePath);

  if (!filePath.startsWith(CLIENT_DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const body = await readFile(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[extname(filePath)] ?? "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}

const server = createServer((req, res) => {
  void serveStatic(req, res);
});
const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit("connection", ws, req);
  });
});

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

        if (msg.resumePlayerId) {
          const player = room.resume(msg.resumePlayerId);
          if (!player) {
            send(ws, { type: "error", code: "RESUME_FAILED", message: "Session expired or already active" });
            return;
          }
          connections.set(ws, { playerId: player.id, roomId: room.id });
          send(ws, { type: "join_ack", playerId: player.id, room: room.snapshot() });
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
          facing: updated.facing
        });
        break;
      }

      case "leave_room": {
        leaveRoom(ws);
        break;
      }

      case "list_rooms": {
        const roomList = [...rooms.values()].map((room) => {
          const snap = room.snapshot();
          return {
            id: snap.id,
            name: snap.name,
            playerCount: snap.players.length,
            maxPlayers: snap.maxPlayers
          }
        });
        send(ws, { type: "room_list", rooms: roomList });
        break;
      }
    }
  });

  ws.on("close", () => handleClose(ws));
});

function leaveRoom(ws: WebSocket): void {
  const state = connections.get(ws);
  if (!state) return;
  const room = rooms.get(state.roomId);
  room?.removePlayer(state.playerId);
  connections.delete(ws);
  if (room) broadcast(room.id, { type: "player_left", playerId: state.playerId });
}

function handleClose(ws: WebSocket): void {
  const state = connections.get(ws);
  connections.delete(ws);
  if (!state) return;
  const room = rooms.get(state.roomId);
  if (!room) return;
  room.holdForGrace(state.playerId, () => {
    broadcast(room.id, { type: "player_left", playerId: state.playerId });
  });
}

server.listen(PORT, () => {
  console.log(`fantasy-grid server listening on http://localhost:${PORT}`);
});
