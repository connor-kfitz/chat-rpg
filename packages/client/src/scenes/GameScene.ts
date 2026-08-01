import Phaser from "phaser";

import type { Direction, PlayerJoinedMessage, PlayerLeftMessage, PlayerMovedMessage } from "@fantasy-grid/shared";
import { socketClient } from "../net/SocketClient";
import { sessionStore } from "../state/sessionStore";
import { TILE_SIZE } from "../config/constants";
import { PlayerEntity } from "../entities/PlayerEntity";

const KEY_TO_DIRECTION: Record<string, Direction> = {
  "keydown-UP": "up",
  "keydown-DOWN": "down",
  "keydown-LEFT": "left",
  "keydown-RIGHT": "right",
  "keydown-W": "up",
  "keydown-S": "down",
  "keydown-A": "left",
  "keydown-D": "right"
}

export class GameScene extends Phaser.Scene {
  private entities = new Map<string, PlayerEntity>();
  private disconnectOverlay?: Phaser.GameObjects.Container;
  private inputEnabled = true;

  constructor() {
    super("GameScene");
  }

  create(): void {
    const room = sessionStore.room;
    if (!room) {
      this.scene.start("ServerListScene");
      return;
    }

    this.entities.clear();
    this.inputEnabled = true;

    const { width, height } = room.gridSize;
    const data: number[][] = Array.from({ length: height }, () => Array(width).fill(0));
    const map = this.make.tilemap({ data, tileWidth: TILE_SIZE, tileHeight: TILE_SIZE });
    const tileset = map.addTilesetImage("forest_tile", "forest_tile", TILE_SIZE, TILE_SIZE);
    if (tileset) map.createLayer(0, tileset, 0, 0);

    for (const player of room.players) {
      this.entities.set(player.id, PlayerEntity.spawn(this, player));
    }

    const localEntity = sessionStore.playerId ? this.entities.get(sessionStore.playerId) : undefined;
    const gridPixelWidth = width * TILE_SIZE;
    const gridPixelHeight = height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, gridPixelWidth, gridPixelHeight);
    if (localEntity) {
      this.cameras.main.startFollow(localEntity.container, true);
    }

    for (const eventName of Object.keys(KEY_TO_DIRECTION)) {
      this.input.keyboard?.on(eventName, () => this.handleKey(KEY_TO_DIRECTION[eventName]));
    }

    socketClient.on("player_joined", this.onPlayerJoined, this);
    socketClient.on("player_moved", this.onPlayerMoved, this);
    socketClient.on("player_left", this.onPlayerLeft, this);
    socketClient.on("disconnected", this.onDisconnected, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  private handleKey(direction: Direction): void {
    if (!this.inputEnabled) return;

    const localEntity = sessionStore.playerId ? this.entities.get(sessionStore.playerId) : undefined;
    // Optimistic, position-independent facing update: the server silently drops
    // moves that would leave the grid with no broadcast at all, so a bump into
    // the edge would otherwise never update facing. This never touches position,
    // so it cannot desync from the server's authoritative state.
    localEntity?.setFacing(direction);

    socketClient.send({ type: "move", direction });
  }

  private onPlayerJoined(msg: PlayerJoinedMessage): void {
    if (this.entities.has(msg.player.id)) return;
    this.entities.set(msg.player.id, PlayerEntity.spawn(this, msg.player));
  }

  private onPlayerMoved(msg: PlayerMovedMessage): void {
    this.entities.get(msg.playerId)?.moveTo(msg.facing, msg.position);
  }

  private onPlayerLeft(msg: PlayerLeftMessage): void {
    this.entities.get(msg.playerId)?.destroy();
    this.entities.delete(msg.playerId);
  }

  private onDisconnected(): void {
    if (this.disconnectOverlay) return;
    this.inputEnabled = false;

    const box = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.7).setOrigin(0, 0);
    const text = this.add
      .text(this.scale.width / 2, this.scale.height / 2, "Connection lost — refresh to rejoin", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#ffffff"
      })
      .setOrigin(0.5, 0.5);
    this.disconnectOverlay = this.add.container(0, 0, [box, text]);
    this.disconnectOverlay.setScrollFactor(0);
    this.disconnectOverlay.setDepth(10_000);
  }

  private cleanup(): void {
    for (const eventName of Object.keys(KEY_TO_DIRECTION)) {
      this.input.keyboard?.off(eventName);
    }
    socketClient.off("player_joined", this.onPlayerJoined, this);
    socketClient.off("player_moved", this.onPlayerMoved, this);
    socketClient.off("player_left", this.onPlayerLeft, this);
    socketClient.off("disconnected", this.onDisconnected, this);
    for (const entity of this.entities.values()) entity.destroy();
    this.entities.clear();
  }
}
