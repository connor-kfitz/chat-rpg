import Phaser from "phaser";

// Placeholder boot scene: confirms Vite + Phaser + the generated sprites all
// load correctly. The real CharacterSelectScene / ServerListScene / GameScene
// get built out during the frontend implementation phase (see specs/01-functional-spec.md).
class BootScene extends Phaser.Scene {
  preload() {
    this.load.image("forest_tile", "/assets/sprites/forest_tile.png");
    this.load.spritesheet("mage", "/assets/sprites/mage_spritesheet.png", {
      frameWidth: 32,
      frameHeight: 32,
    });
  }

  create() {
    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 8; y++) {
        this.add.image(x * 32, y * 32, "forest_tile").setOrigin(0, 0);
      }
    }
    this.add.sprite(160, 128, "mage", 0);
    this.add
      .text(8, 8, "fantasy-grid scaffold OK", { fontFamily: "monospace", fontSize: "14px" })
      .setBackgroundColor("#000000aa");
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 320,
  height: 256,
  parent: "game-root",
  pixelArt: true,
  scene: BootScene,
});
