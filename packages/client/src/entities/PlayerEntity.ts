import Phaser from "phaser";

import type { Direction, Player, Position } from "@fantasy-grid/shared";
import { CHARACTER_DISPLAY_SCALE, MOVE_TWEEN_MS, TILE_SIZE } from "../config/constants";
import { idleFrame, walkAnimKey } from "../anims/registerCharacterAnimations";

function toPixelCenter(position: Position): { x: number; y: number } {
  return {
    x: position.x * TILE_SIZE + TILE_SIZE / 2,
    y: position.y * TILE_SIZE + TILE_SIZE / 2
  }
}

export class PlayerEntity {
  readonly playerId: string;
  readonly container: Phaser.GameObjects.Container;
  private sprite: Phaser.GameObjects.Sprite;
  private characterClass: Player["characterClass"];
  private scene: Phaser.Scene;

  private constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.playerId = player.id;
    this.characterClass = player.characterClass;

    const { x, y } = toPixelCenter(player.position);
    this.sprite = scene.add.sprite(0, 0, player.characterClass, idleFrame(player.characterClass, player.facing));
    this.sprite.setScale(CHARACTER_DISPLAY_SCALE);
    this.sprite.setFlipX(player.facing === "left");

    const label = scene.add
      .text(0, -24, player.displayName, {
        fontFamily: "monospace",
        fontSize: "10px",
        color: "#ffffff"
      })
      .setOrigin(0.5, 0.5);

    this.container = scene.add.container(x, y, [this.sprite, label]);
    this.container.setDepth(player.position.y);
  }

  static spawn(scene: Phaser.Scene, player: Player): PlayerEntity {
    return new PlayerEntity(scene, player);
  }

  moveTo(direction: Direction, position: Position): void {
    this.scene.tweens.killTweensOf(this.container);
    this.sprite.setFlipX(direction === "left");
    this.sprite.play(walkAnimKey(this.characterClass, direction));

    const { x, y } = toPixelCenter(position);
    this.scene.tweens.add({
      targets: this.container,
      x,
      y,
      duration: MOVE_TWEEN_MS,
      ease: "Linear",
      onComplete: () => {
        this.sprite.stop();
        this.sprite.setFrame(idleFrame(this.characterClass, direction));
      }
    });
    this.container.setDepth(position.y);
  }

  setFacing(direction: Direction): void {
    if (this.scene.tweens.isTweening(this.container)) return;
    this.sprite.setFlipX(direction === "left");
    this.sprite.setFrame(idleFrame(this.characterClass, direction));
  }

  destroy(): void {
    this.scene.tweens.killTweensOf(this.container);
    this.container.destroy();
  }
}
