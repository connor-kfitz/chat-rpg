import type { CharacterClass, Direction, Player, RoomSnapshot } from "./types.js";

// ---- Client -> Server ----

export interface JoinRoomMessage {
  type: "join_room";
  roomId: string;
  displayName: string;
  characterClass: CharacterClass;
  resumePlayerId?: string;
}

export interface MoveMessage {
  type: "move";
  direction: Direction;
}

export interface LeaveRoomMessage {
  type: "leave_room";
}

export interface ListRoomsMessage {
  type: "list_rooms";
}

export type ClientMessage = JoinRoomMessage | MoveMessage | LeaveRoomMessage | ListRoomsMessage;

// ---- Server -> Client ----

export interface JoinAckMessage {
  type: "join_ack";
  playerId: string;
  room: RoomSnapshot;
}

export interface PlayerJoinedMessage {
  type: "player_joined";
  player: Player;
}

export interface PlayerMovedMessage {
  type: "player_moved";
  playerId: string;
  position: Player["position"];
  facing: Direction;
}

export interface PlayerLeftMessage {
  type: "player_left";
  playerId: string;
}

export type ErrorCode = "ROOM_FULL" | "NAME_TAKEN" | "INVALID_MOVE" | "RESUME_FAILED";

export interface ErrorMessage {
  type: "error";
  code: ErrorCode;
  message: string;
}

export interface RoomListEntry {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
}

export interface RoomListMessage {
  type: "room_list";
  rooms: RoomListEntry[];
}

export type ServerMessage =
  | JoinAckMessage
  | PlayerJoinedMessage
  | PlayerMovedMessage
  | PlayerLeftMessage
  | ErrorMessage
  | RoomListMessage;
