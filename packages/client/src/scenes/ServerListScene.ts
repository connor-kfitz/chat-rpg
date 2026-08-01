import Phaser from "phaser";

import type { ErrorMessage, JoinAckMessage, RoomListEntry, RoomListMessage } from "@fantasy-grid/shared";
import { socketClient } from "../net/SocketClient";
import { clearPersistedSession, persistSession, sessionStore } from "../state/sessionStore";
import { WS_URL } from "../config/constants";

const POLL_INTERVAL_MS = 4000;
const ROW_START_Y = 140;
const ROW_HEIGHT = 60;

interface Row {
  container: Phaser.GameObjects.Container;
  joinButton: Phaser.GameObjects.Text;
}

export class ServerListScene extends Phaser.Scene {
  private statusText!: Phaser.GameObjects.Text;
  private errorText!: Phaser.GameObjects.Text;
  private rows: Row[] = [];
  private pollTimer?: Phaser.Time.TimerEvent;
  private joining = false;
  private resuming = false;

  constructor() {
    super("ServerListScene");
  }

  create(): void {
    this.joining = false;
    this.resuming = false;

    this.add
      .text(this.scale.width / 2, 40, "Server List", { fontFamily: "monospace", fontSize: "20px" })
      .setOrigin(0.5, 0.5);

    this.statusText = this.add
      .text(this.scale.width / 2, 90, "Connecting...", { fontFamily: "monospace", fontSize: "14px" })
      .setOrigin(0.5, 0.5);

    this.errorText = this.add
      .text(this.scale.width / 2, this.scale.height - 40, "", {
        fontFamily: "monospace",
        fontSize: "13px",
        color: "#ff6666"
      })
      .setOrigin(0.5, 0.5);

    socketClient.on("connected", this.onConnected, this);
    socketClient.on("room_list", this.onRoomList, this);
    socketClient.on("join_ack", this.onJoinAck, this);
    socketClient.on("error", this.onError, this);
    socketClient.on("disconnected", this.onDisconnected, this);

    socketClient.connect(WS_URL);

    this.pollTimer = this.time.addEvent({
      delay: POLL_INTERVAL_MS,
      loop: true,
      callback: () => socketClient.send({ type: "list_rooms" })
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private onConnected(): void {
    this.statusText.setText("Connected");
    socketClient.send({ type: "list_rooms" });

    if (sessionStore.playerId && sessionStore.roomId && sessionStore.characterClass) {
      this.resuming = true;
      this.statusText.setText("Reconnecting...");
      socketClient.send({
        type: "join_room",
        roomId: sessionStore.roomId,
        displayName: sessionStore.displayName,
        characterClass: sessionStore.characterClass,
        resumePlayerId: sessionStore.playerId
      });
    }
  }

  private onDisconnected(): void {
    this.statusText.setText("Disconnected — refresh to retry");
  }

  private onRoomList(msg: RoomListMessage): void {
    this.renderRows(msg.rooms);
  }

  private renderRows(entries: RoomListEntry[]): void {
    for (const row of this.rows) row.container.destroy();
    this.rows = [];

    entries.forEach((entry, index) => {
      const y = ROW_START_Y + index * ROW_HEIGHT;
      const container = this.add.container(this.scale.width / 2, y);

      const label = this.add
        .text(-180, 0, `${entry.name} — ${entry.playerCount}/${entry.maxPlayers}`, {
          fontFamily: "monospace",
          fontSize: "14px"
        })
        .setOrigin(0, 0.5);

      const joinButton = this.add
        .text(150, 0, "Join", {
          fontFamily: "monospace",
          fontSize: "14px",
          backgroundColor: "#333333",
          padding: { x: 12, y: 6 }
        })
        .setOrigin(0.5, 0.5)
        .setInteractive({ useHandCursor: true });
      joinButton.on("pointerdown", () => this.joinRoom(entry.id));

      container.add([label, joinButton]);
      this.rows.push({ container, joinButton });
    });
  }

  private joinRoom(roomId: string): void {
    if (this.joining) return;
    if (!sessionStore.characterClass) {
      this.scene.start("CharacterSelectScene");
      return;
    }
    this.joining = true;
    this.errorText.setText("");
    for (const row of this.rows) row.joinButton.disableInteractive().setAlpha(0.5);

    socketClient.send({
      type: "join_room",
      roomId,
      displayName: sessionStore.displayName,
      characterClass: sessionStore.characterClass
    });
  }

  private onJoinAck(msg: JoinAckMessage): void {
    sessionStore.playerId = msg.playerId;
    sessionStore.roomId = msg.room.id;
    sessionStore.room = msg.room;
    persistSession();
    this.scene.start("GameScene");
  }

  private onError(msg: ErrorMessage): void {
    if (this.resuming) {
      this.resuming = false;
      sessionStore.playerId = null;
      sessionStore.roomId = null;
      clearPersistedSession();
      this.statusText.setText("Connected");
    }

    this.joining = false;
    for (const row of this.rows) row.joinButton.setInteractive({ useHandCursor: true }).setAlpha(1);
    this.errorText.setText(msg.message);
  }

  private cleanup(): void {
    socketClient.off("connected", this.onConnected, this);
    socketClient.off("room_list", this.onRoomList, this);
    socketClient.off("join_ack", this.onJoinAck, this);
    socketClient.off("error", this.onError, this);
    socketClient.off("disconnected", this.onDisconnected, this);
    this.pollTimer?.destroy();
  }
}
