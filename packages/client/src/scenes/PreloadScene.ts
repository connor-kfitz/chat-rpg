import Phaser from "phaser";

import { registerCharacterAnimations } from "../anims/registerCharacterAnimations";

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    const loadingText = this.add.text(this.scale.width / 2, this.scale.height / 2, "Loading...", {
      fontFamily: "monospace",
      fontSize: "16px"
    });
    loadingText.setOrigin(0.5, 0.5);

    this.load.on("progress", (value: number) => {
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.image("forest_tile", "/assets/sprites/forest_tile.png");
    this.load.spritesheet("mage", "/assets/sprites/mage_spritesheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.spritesheet("knight", "/assets/sprites/knight_spritesheet.png", {
      frameWidth: 32,
      frameHeight: 32
    });
    this.load.image("mage_portrait", "/assets/portraits/mage_portrait.png");
    this.load.image("knight_portrait", "/assets/portraits/knight_portrait.png");
  }

  create(): void {
    registerCharacterAnimations(this);
    this.scene.start("CharacterSelectScene");
  }
}
