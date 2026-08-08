import Phaser from "phaser";

import { DESIGN_WIDTH, DESIGN_HEIGHT } from "../config/constants";

/**
 * A container holding all objects for a menu scene laid out at DESIGN_WIDTH x DESIGN_HEIGHT.
 * Keeps that layout centered as the canvas resizes (it only ever grows past the design size,
 * per the Scale Manager's `min` config), instead of pinned to the top-left corner.
 */
export function createCenteredLayer(scene: Phaser.Scene): Phaser.GameObjects.Container {
  const container = scene.add.container(0, 0);

  const reposition = () => {
    container.setPosition((scene.scale.width - DESIGN_WIDTH) / 2, (scene.scale.height - DESIGN_HEIGHT) / 2);
  };
  reposition();

  scene.scale.on(Phaser.Scale.Events.RESIZE, reposition);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.scale.off(Phaser.Scale.Events.RESIZE, reposition);
  });

  return container;
}
