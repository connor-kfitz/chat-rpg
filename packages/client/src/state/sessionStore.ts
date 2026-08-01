import type { CharacterClass, RoomSnapshot } from "@fantasy-grid/shared";

/**
 * Single source of truth for cross-scene session data. Mutated only at two
 * points: CharacterSelectScene's Confirm click, and receipt of join_ack.
 */
class SessionStore {
  displayName = "";
  characterClass: CharacterClass | null = null;
  playerId: string | null = null;
  roomId: string | null = null;
  room: RoomSnapshot | null = null;
}

export const sessionStore = new SessionStore();

const STORAGE_KEY = "fantasy-grid-session";

interface PersistedSession {
  playerId: string;
  roomId: string;
  displayName: string;
  characterClass: CharacterClass;
}

export function persistSession(): void {
  if (!sessionStore.playerId || !sessionStore.roomId || !sessionStore.characterClass) return;
  const persisted: PersistedSession = {
    playerId: sessionStore.playerId,
    roomId: sessionStore.roomId,
    displayName: sessionStore.displayName,
    characterClass: sessionStore.characterClass
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}

export function loadPersistedSession(): PersistedSession | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export function clearPersistedSession(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
