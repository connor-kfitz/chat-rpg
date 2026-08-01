import Phaser from "phaser";

import type { ClientMessage, ServerMessage } from "@fantasy-grid/shared";

/**
 * Thin typed wrapper around the native WebSocket. Emits one event per
 * ServerMessage["type"] value, plus "connected"/"disconnected" for the
 * connection lifecycle. A module-level singleton (see bottom of file) so it
 * survives Phaser scene transitions without living in any one scene.
 */
class SocketClient extends Phaser.Events.EventEmitter {
  private ws: WebSocket | null = null;

  connect(url: string): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const ws = new WebSocket(url);
    this.ws = ws;

    ws.onopen = () => this.emit("connected");

    ws.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }
      this.emit(msg.type, msg);
    }

    ws.onclose = () => this.emit("disconnected");
    ws.onerror = () => this.emit("disconnected");
  }

  send(message: ClientMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}

export const socketClient = new SocketClient();
