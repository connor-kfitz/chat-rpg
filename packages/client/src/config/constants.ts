import { MOVE_COOLDOWN_MS, type Direction } from "@fantasy-grid/shared";

export { MOVE_COOLDOWN_MS };

export const TILE_SIZE = 32;
export const DESIGN_WIDTH = 640;
export const DESIGN_HEIGHT = 480;

export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

export const ROOM_ID = "forest-1";

export const ANIM_FRAME_RATE = 10;

/** Kept under the server's 150ms move cooldown so a tween never lags behind the next accepted move. */
export const MOVE_TWEEN_MS = 140;

/** Character spritesheets are a 6-col x 13-row grid of this many pixels per frame. */
export const CHARACTER_FRAME_SIZE = 48;
export const CHARACTER_FRAMES_PER_ROW = 6;

/**
 * The character's actual drawn silhouette only fills ~25px of each 48px frame (the rest is
 * transparent padding), so scaling by TILE_SIZE / CHARACTER_FRAME_SIZE renders it far smaller
 * than one tile. This scale instead targets the character reading at roughly one-tile-tall.
 */
export const CHARACTER_DISPLAY_SCALE = 1.3;

/**
 * Row index (within each character's spritesheet) for idle/walk frames, per direction.
 * The sheets only draw down/right/up (the "profile" row faces right) — left-facing reuses
 * the right row, mirrored horizontally at render time (see PlayerEntity's setFlipX).
 */
export type DrawnDirection = Exclude<Direction, "left">;

export const IDLE_ROW: Record<DrawnDirection, number> = {
  down: 0,
  right: 1,
  up: 2
}

export const WALK_ROW: Record<DrawnDirection, number> = {
  down: 3,
  right: 4,
  up: 5
}
