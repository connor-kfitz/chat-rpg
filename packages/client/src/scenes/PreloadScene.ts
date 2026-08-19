import Phaser from "phaser";

import { registerCharacterAnimations } from "../anims/registerCharacterAnimations";
import { registerAnimalAnimations } from "../anims/registerAnimalAnimations";
import { loadPersistedSession, sessionStore } from "../state/sessionStore";
import { TILESET_MANIFEST } from "../generated/tilesetManifest";
import { ANIMAL_SPRITES } from "../config/animalAnims";
import { CHARACTER_FRAME_SIZE } from "../config/constants";

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

    this.load.tilemapTiledJSON("world", "/assets/tilemaps/world.tmj");
    for (const tileset of TILESET_MANIFEST) {
      this.load.image(tileset.key, tileset.url);
    }
    // Animal tilesets are also loaded as spritesheets (in addition to the plain tileset image
    // above) so they can be played as looping sprite animations instead of static map tiles —
    // see GameScene's animal-sprite spawning and registerAnimalAnimations.
    for (const animal of ANIMAL_SPRITES) {
      const manifestEntry = TILESET_MANIFEST.find((tileset) => tileset.name === animal.name);
      if (!manifestEntry) continue;
      this.load.spritesheet(animal.key, manifestEntry.url, {
        frameWidth: animal.frameWidth,
        frameHeight: animal.frameHeight
      });
    }
    this.load.spritesheet("knight", "/assets/sprites/knight_spritesheet.png", {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE
    });
    this.load.spritesheet("templar", "/assets/sprites/templar_spritesheet.png", {
      frameWidth: CHARACTER_FRAME_SIZE,
      frameHeight: CHARACTER_FRAME_SIZE
    });
    this.load.image("knight_portrait", "/assets/portraits/knight_portrait.png");
    this.load.image("templar_portrait", "/assets/portraits/templar_portrait.png");
  }

  create(): void {
    registerCharacterAnimations(this);
    registerAnimalAnimations(this);

    const persisted = loadPersistedSession();
    if (persisted) {
      sessionStore.playerId = persisted.playerId;
      sessionStore.roomId = persisted.roomId;
      sessionStore.displayName = persisted.displayName;
      sessionStore.characterClass = persisted.characterClass;
      this.scene.start("ServerListScene");
      return;
    }

    this.scene.start("CharacterSelectScene");
  }
}
