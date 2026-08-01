import type { CharacterClass, Direction, Player, RoomSnapshot } from "@fantasy-grid/shared";

const MOVE_COOLDOWN_MS = 150;
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
  private players = new Map<string, InternalPlayer>();
  private graceTimers = new Map<string, NodeJS.Timeout>();

  constructor(id: string, name: string, gridSize = { width: 20, height: 20 }, maxPlayers = 50) {
    this.id = id;
    this.name = name;
    this.gridSize = gridSize;
    this.maxPlayers = maxPlayers;
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

    if (!inBounds) {
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
      tileType: "forest",
      maxPlayers: this.maxPlayers,
      players: [...this.players.values()].map(({ lastMoveAt: _drop, ...p }) => p)
    }
  }

  private randomSpawn() {
    return {
      x: Math.floor(this.gridSize.width / 2),
      y: Math.floor(this.gridSize.height / 2)
    }
  }
}

export const rooms = new Map<string, Room>([["forest-1", new Room("forest-1", "Forest Server")]]);
