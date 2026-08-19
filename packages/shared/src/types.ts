export type CharacterClass = "knight" | "templar";
export type Direction = "up" | "down" | "left" | "right";

export interface Position {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  displayName: string;
  characterClass: CharacterClass;
  position: Position;
  facing: Direction;
  connectedAt: number;
}

export interface RoomSnapshot {
  id: string;
  name: string;
  gridSize: { width: number; height: number };
  players: Player[];
  maxPlayers: number;
}
