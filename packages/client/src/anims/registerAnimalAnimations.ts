import Phaser from "phaser";

import { ANIMAL_SPRITES } from "../config/animalAnims";

/** Called once from PreloadScene after the animal spritesheets finish loading. */
export function registerAnimalAnimations(scene: Phaser.Scene): void {
  for (const animal of ANIMAL_SPRITES) {
    if (!scene.textures.exists(animal.key)) continue;
    scene.anims.create({
      key: animal.key,
      frames: scene.anims.generateFrameNumbers(animal.key, { start: 0, end: animal.frameCount - 1 }),
      frameRate: animal.frameRate,
      repeat: -1,
      // The frame sequence is one-directional (e.g. sitting -> submerged), so without yoyo it
      // would hard-cut from the last frame back to the first each loop; yoyo plays it in reverse
      // afterwards instead, so the critter animates back up instead of snapping there.
      yoyo: true
    });
  }
}
