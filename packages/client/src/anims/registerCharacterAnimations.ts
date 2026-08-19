import Phaser from "phaser";

import type { CharacterClass, Direction } from "@fantasy-grid/shared";
import { ANIM_FRAME_RATE, CHARACTER_FRAMES_PER_ROW, DrawnDirection, IDLE_ROW, WALK_ROW } from "../config/constants";

const CHARACTER_CLASSES: CharacterClass[] = ["knight", "templar"];
const DRAWN_DIRECTIONS: DrawnDirection[] = ["down", "right", "up"];

/** The spritesheet only draws down/right/up — left-facing mirrors the right row (see PlayerEntity). */
function drawnDirection(direction: Direction): DrawnDirection {
  return direction === "left" ? "right" : direction;
}

export function walkAnimKey(characterClass: CharacterClass, direction: Direction): string {
  return `${characterClass}-walk-${drawnDirection(direction)}`;
}

export function idleFrame(characterClass: CharacterClass, direction: Direction): number {
  return IDLE_ROW[drawnDirection(direction)] * CHARACTER_FRAMES_PER_ROW;
}

/** Called once from PreloadScene after the spritesheets finish loading. */
export function registerCharacterAnimations(scene: Phaser.Scene): void {
  for (const characterClass of CHARACTER_CLASSES) {
    for (const direction of DRAWN_DIRECTIONS) {
      const start = WALK_ROW[direction] * CHARACTER_FRAMES_PER_ROW;
      scene.anims.create({
        key: walkAnimKey(characterClass, direction),
        frames: scene.anims.generateFrameNumbers(characterClass, { start, end: start + CHARACTER_FRAMES_PER_ROW - 1 }),
        frameRate: ANIM_FRAME_RATE,
        repeat: -1
      });
    }
  }
}
