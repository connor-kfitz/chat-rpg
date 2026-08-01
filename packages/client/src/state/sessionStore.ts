import type { CharacterClass, RoomSnapshot } from "@fantasy-grid/shared";

/**
 * Single source of truth for cross-scene session data. Mutated only at two
 * points: CharacterSelectScene's Confirm click, and receipt of join_ack.
 */
class SessionStore {
  displayName = "";
  characterClass: CharacterClass | null = null;
  playerId: string | null = null;
  room: RoomSnapshot | null = null;
}

export const sessionStore = new SessionStore();
