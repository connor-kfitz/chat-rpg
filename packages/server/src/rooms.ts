import { MOVE_COOLDOWN_MS, type CharacterClass, type Direction, type Player, type RoomSnapshot } from "@fantasy-grid/shared";
import { loadTerrain } from "./terrain.js";

const GRACE_PERIOD_MS = 60_000;

const DELTA: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
}

interface InternalPlayer extends Player {
  lastMoveAt: number;
}

export class Room {
  readonly id: string;
  readonly name: string;
  readonly gridSize: { width: number; height: number };
  readonly maxPlayers: number;
  private walkable: boolean[][];
  private players = new Map<string, InternalPlayer>();
  private graceTimers = new Map<string, NodeJS.Timeout>();

  constructor(
    id: string,
    name: string,
    gridSize: { width: number; height: number },
    walkable: boolean[][],
    maxPlayers = 50
  ) {
    this.id = id;
    this.name = name;
    this.gridSize = gridSize;
    this.walkable = walkable;
    this.maxPlayers = maxPlayers;
  }

  private isWalkable(x: number, y: number): boolean {
    return this.walkable[y]?.[x] ?? false;
  }

  isFull(): boolean {
    return this.players.size >= this.maxPlayers;
  }

  isNameTaken(displayName: string): boolean {
    return [...this.players.values()].some((p) => p.displayName === displayName);
  }

  addPlayer(id: string, displayName: string, characterClass: CharacterClass): InternalPlayer {
    const player: InternalPlayer = {
      id,
      displayName,
      characterClass,
      position: this.randomSpawn(),
      facing: "down",
      connectedAt: Date.now(),
      lastMoveAt: 0
    }
    this.players.set(id, player);
    return player;
  }

  removePlayer(id: string): void {
    this.players.delete(id);
  }

  getPlayer(id: string): InternalPlayer | undefined {
    return this.players.get(id);
  }

  /** Keeps the player's slot reserved for `ms`, then removes them and calls `onExpire`. */
  holdForGrace(id: string, onExpire: () => void, ms = GRACE_PERIOD_MS): void {
    const timer = setTimeout(() => {
      this.graceTimers.delete(id);
      this.removePlayer(id);
      onExpire();
    }, ms);
    this.graceTimers.set(id, timer);
  }

  /** Reclaims a slot still held in its grace window, or returns null if there isn't one. */
  resume(id: string): InternalPlayer | null {
    const timer = this.graceTimers.get(id);
    if (!timer) return null;
    clearTimeout(timer);
    this.graceTimers.delete(id);
    return this.players.get(id) ?? null;
  }

  /** Returns the updated player on success, or null if the move was rejected. */
  tryMove(id: string, direction: Direction): InternalPlayer | null {
    const player = this.players.get(id);
    if (!player) return null;

    const now = Date.now();
    if (now - player.lastMoveAt < MOVE_COOLDOWN_MS) return null;

    player.facing = direction;
    const { dx, dy } = DELTA[direction];
    const nextX = player.position.x + dx;
    const nextY = player.position.y + dy;

    const inBounds =
      nextX >= 0 && nextX < this.gridSize.width && nextY >= 0 && nextY < this.gridSize.height;

    if (!inBounds || !this.isWalkable(nextX, nextY)) {
      player.lastMoveAt = now;
      return null;
    }

    player.position = { x: nextX, y: nextY }
    player.lastMoveAt = now;
    return player;
  }

  snapshot(): RoomSnapshot {
    return {
      id: this.id,
      name: this.name,
      gridSize: this.gridSize,
      maxPlayers: this.maxPlayers,
      players: [...this.players.values()].map(({ lastMoveAt: _drop, ...p }) => p)
    }
  }

  /** Grid center if walkable, otherwise the nearest walkable tile found by expanding outward. */
  private randomSpawn() {
    const centerX = Math.floor(this.gridSize.width / 2);
    const centerY = Math.floor(this.gridSize.height / 2);
    if (this.isWalkable(centerX, centerY)) return { x: centerX, y: centerY }

    const maxRadius = Math.max(this.gridSize.width, this.gridSize.height);
    for (let radius = 1; radius <= maxRadius; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
          const x = centerX + dx;
          const y = centerY + dy;
          if (this.isWalkable(x, y)) return { x, y }
        }
      }
    }

    return { x: centerX, y: centerY }
  }
}

const terrain = loadTerrain();
export const rooms = new Map<string, Room>([
  [
    "forest-1",
    new Room("forest-1", "Forest Server", { width: terrain.width, height: terrain.height }, terrain.walkable)
  ]
]);
