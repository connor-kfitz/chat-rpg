import type { Direction } from "@fantasy-grid/shared";

export const TILE_SIZE = 32;
export const DESIGN_WIDTH = 640;
export const DESIGN_HEIGHT = 480;

export const WS_URL = import.meta.env.VITE_WS_URL ?? "ws://localhost:8080";

export const ROOM_ID = "forest-1";

export const ANIM_FRAME_RATE = 6;

/** Kept under the server's 150ms move cooldown so a tween never lags behind the next accepted move. */
export const MOVE_TWEEN_MS = 140;

/** First frame index of each direction's row in the 4-row x 3-col spritesheet layout. */
export const DIRECTION_ROW_START: Record<Direction, number> = {
  down: 0,
  up: 3,
  left: 6,
  right: 9
}
