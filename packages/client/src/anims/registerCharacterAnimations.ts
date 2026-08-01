import Phaser from "phaser";

import type { CharacterClass, Direction } from "@fantasy-grid/shared";
import { ANIM_FRAME_RATE, DIRECTION_ROW_START } from "../config/constants";

const CHARACTER_CLASSES: CharacterClass[] = ["mage", "knight"];
const DIRECTIONS: Direction[] = ["down", "up", "left", "right"];

export function walkAnimKey(characterClass: CharacterClass, direction: Direction): string {
  return `${characterClass}-walk-${direction}`;
}

export function idleFrame(characterClass: CharacterClass, direction: Direction): number {
  return DIRECTION_ROW_START[direction];
}

/** Called once from PreloadScene after the spritesheets finish loading. */
export function registerCharacterAnimations(scene: Phaser.Scene): void {
  for (const characterClass of CHARACTER_CLASSES) {
    for (const direction of DIRECTIONS) {
      const start = DIRECTION_ROW_START[direction];
      scene.anims.create({
        key: walkAnimKey(characterClass, direction),
        frames: scene.anims.generateFrameNumbers(characterClass, { start, end: start + 2 }),
        frameRate: ANIM_FRAME_RATE,
        repeat: -1
      });
    }
  }
}
