import Phaser from "phaser";

import type { ChatMessage, Direction, PlayerJoinedMessage, PlayerLeftMessage, PlayerMovedMessage } from "@fantasy-grid/shared";
import { socketClient } from "../net/SocketClient";
import { sessionStore } from "../state/sessionStore";
import { MOVE_COOLDOWN_MS, TILE_SIZE } from "../config/constants";
import { PlayerEntity } from "../entities/PlayerEntity";
import { TILESET_MANIFEST } from "../generated/tilesetManifest";
import { ANIMAL_SPRITES } from "../config/animalAnims";
import { ChatPanel } from "../ui/ChatPanel";

const MAP_LAYER_NAMES = ["Terrain", "Terrain Shadows", "Objects", "Objects Two"];
const ABOVE_PLAYER_LAYER_NAME = "Above Player";
const ANIMALS_LAYER_NAME = "Animals";

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;
const DIRECTION_KEY_CODES: Record<Direction, number[]> = {
  up: [KeyCodes.UP, KeyCodes.W],
  down: [KeyCodes.DOWN, KeyCodes.S],
  left: [KeyCodes.LEFT, KeyCodes.A],
  right: [KeyCodes.RIGHT, KeyCodes.D]
}

export class GameScene extends Phaser.Scene {
  private entities = new Map<string, PlayerEntity>();
  private disconnectOverlay?: Phaser.GameObjects.Container;
  private inputEnabled = true;
  private gridPixelWidth = 0;
  private gridPixelHeight = 0;
  private registeredKeys: Phaser.Input.Keyboard.Key[] = [];
  private heldDirections: Direction[] = [];
  private lastMoveSentAt = 0;
  private chatPanel?: ChatPanel;

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
    this.registeredKeys = [];
    this.heldDirections = [];
    this.lastMoveSentAt = 0;

    const { width, height } = room.gridSize;
    const map = this.make.tilemap({ key: "world" });
    for (const tileset of TILESET_MANIFEST) {
      map.addTilesetImage(tileset.name, tileset.key);
    }
    for (const layerName of MAP_LAYER_NAMES) {
      const layer = map.createLayer(layerName, map.tilesets, 0, 0);
      layer?.setScale(TILE_SIZE / map.tileWidth);
    }
    this.spawnAnimalSprites(map);

    for (const player of room.players) {
      this.entities.set(player.id, PlayerEntity.spawn(this, player));
    }

    // A player's depth is its grid Y (see PlayerEntity), maxing out at height - 1, so this depth
    // always wins — tree canopies, well rims etc. on this layer draw over a player standing
    // "behind" them instead of under, without hiding the player anywhere else on the map.
    const abovePlayerLayer = map.createLayer(ABOVE_PLAYER_LAYER_NAME, map.tilesets, 0, 0);
    abovePlayerLayer?.setScale(TILE_SIZE / map.tileWidth);
    abovePlayerLayer?.setDepth(height);

    const localEntity = sessionStore.playerId ? this.entities.get(sessionStore.playerId) : undefined;
    this.gridPixelWidth = width * TILE_SIZE;
    this.gridPixelHeight = height * TILE_SIZE;
    this.cameras.main.setBounds(0, 0, this.gridPixelWidth, this.gridPixelHeight);
    if (localEntity) {
      this.cameras.main.startFollow(localEntity.container, true);
    }

    // Bounds clamp scrolling but not the viewport itself, so a map smaller than the canvas
    // would otherwise render pinned to the top-left with dead space on the right/bottom.
    this.updateCameraViewport();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.updateCameraViewport, this);

    this.registerMovementKeys();
    this.chatPanel = new ChatPanel(this);

    socketClient.on("player_joined", this.onPlayerJoined, this);
    socketClient.on("player_moved", this.onPlayerMoved, this);
    socketClient.on("player_left", this.onPlayerLeft, this);
    socketClient.on("chat", this.onChat, this);
    socketClient.on("disconnected", this.onDisconnected, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
  }

  // The "Animals" layer's tiles are the *first* frame of a looping critter animation (e.g. a
  // capybara mid-dive), not static decoration — Tiled/tilemap layers can't play per-tile
  // animations for arbitrary licensed tilesets, so instead of rendering this layer as tiles we
  // read its placements and spawn an animated Sprite per instance. Each critter is a 2x2 block of
  // tiles (bigger than one 16px tile), so the map places 4 tile ids per instance: {n, n+1} on one
  // row and {n+half, n+half+1} on the row below, where half is the tileset's raw tile count / 2.
  // Only the `n` tile (even, and in the tileset's first half) is used as the block's anchor —
  // the other 3 are skipped, since they're already accounted for by it. A block can be flipped
  // (Tiled flip flags) as a whole for placement variety; when flipped, the anchor tile sits at
  // the block's far corner instead of its top-left, so the block's origin is shifted back by one
  // tile on the flipped axis/axes.
  private spawnAnimalSprites(map: Phaser.Tilemaps.Tilemap): void {
    const layer = map.getLayer(ANIMALS_LAYER_NAME);
    if (!layer) return;

    const scale = TILE_SIZE / map.tileWidth;
    // Every instance of a given critter reuses the same tile ids, so they'd otherwise all start
    // on frame 0 and bob in perfect unison — stagger each successive instance of the same critter
    // roughly half a cycle apart from the last so they read as independent animals.
    const instanceCounts = new Map<string, number>();
    for (const row of layer.data) {
      for (const tile of row) {
        if (tile.index <= 0) continue;

        const tileset = map.tilesets.find((candidate) => candidate.containsTileIndex(tile.index));
        const animal = tileset && ANIMAL_SPRITES.find((candidate) => candidate.name === tileset.name);
        if (!tileset || !animal || !this.textures.exists(animal.key)) continue;

        const localId = tile.index - tileset.firstgid;
        if (localId % 2 !== 0 || localId >= tileset.total / 2) continue;

        const originTileX = tile.flipX ? tile.x - 1 : tile.x;
        const originTileY = tile.flipY ? tile.y - 1 : tile.y;
        const sprite = this.add.sprite(originTileX * TILE_SIZE + TILE_SIZE, originTileY * TILE_SIZE + TILE_SIZE, animal.key);
        sprite.setFlip(tile.flipX, tile.flipY);
        sprite.setScale(scale);
        sprite.setDepth(originTileY + 1);

        const instanceIndex = instanceCounts.get(animal.key) ?? 0;
        instanceCounts.set(animal.key, instanceIndex + 1);
        const startFrame = (instanceIndex * Math.ceil(animal.frameCount / 2)) % animal.frameCount;
        sprite.play({ key: animal.key, startFrame });
      }
    }
  }

  private updateCameraViewport(): void {
    const camera = this.cameras.main;
    const viewportWidth = Math.min(this.scale.width, this.gridPixelWidth);
    const viewportHeight = Math.min(this.scale.height, this.gridPixelHeight);
    const offsetX = (this.scale.width - viewportWidth) / 2;
    const offsetY = (this.scale.height - viewportHeight) / 2;
    camera.setViewport(offsetX, offsetY, viewportWidth, viewportHeight);
  }

  private registerMovementKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) return;

    for (const [direction, codes] of Object.entries(DIRECTION_KEY_CODES) as [Direction, number[]][]) {
      for (const code of codes) {
        const key = keyboard.addKey(code);
        key.on("down", () => {
          this.heldDirections = [direction, ...this.heldDirections.filter((d) => d !== direction)];
          this.sendMove(direction, this.time.now);
        });
        key.on("up", () => {
          this.heldDirections = this.heldDirections.filter((d) => d !== direction);
        });
        this.registeredKeys.push(key);
      }
    }
  }

  update(time: number): void {
    if (!this.inputEnabled || this.heldDirections.length === 0) return;
    if (time - this.lastMoveSentAt < MOVE_COOLDOWN_MS) return;

    this.sendMove(this.heldDirections[0], time);
  }

  private sendMove(direction: Direction, time: number): void {
    if (!this.inputEnabled) return;
    this.lastMoveSentAt = time;

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

  private onChat(msg: ChatMessage): void {
    this.chatPanel?.addMessage(msg.displayName, msg.text);
  }

  private onDisconnected(): void {
    if (this.disconnectOverlay) return;
    this.inputEnabled = false;

    const camera = this.cameras.main;
    const box = this.add.rectangle(0, 0, camera.width, camera.height, 0x000000, 0.7).setOrigin(0, 0);
    const text = this.add
      .text(camera.width / 2, camera.height / 2, "Connection lost — refresh to rejoin", {
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
    this.scale.off(Phaser.Scale.Events.RESIZE, this.updateCameraViewport, this);
    for (const key of this.registeredKeys) {
      key.destroy();
    }
    this.registeredKeys = [];
    this.heldDirections = [];
    this.chatPanel?.destroy();
    this.chatPanel = undefined;
    socketClient.off("player_joined", this.onPlayerJoined, this);
    socketClient.off("player_moved", this.onPlayerMoved, this);
    socketClient.off("player_left", this.onPlayerLeft, this);
    socketClient.off("chat", this.onChat, this);
    socketClient.off("disconnected", this.onDisconnected, this);
    for (const entity of this.entities.values()) entity.destroy();
    this.entities.clear();
  }
}
