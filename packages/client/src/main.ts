import Phaser from "phaser";

import "./style.css";
import { DESIGN_WIDTH, DESIGN_HEIGHT } from "./config/constants";
import { PreloadScene } from "./scenes/PreloadScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { ServerListScene } from "./scenes/ServerListScene";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: "game-root",
  backgroundColor: "#ffffff",
  pixelArt: true,
  dom: { createContainer: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    width: window.innerWidth,
    height: window.innerHeight,
    min: { width: DESIGN_WIDTH, height: DESIGN_HEIGHT },
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [PreloadScene, CharacterSelectScene, ServerListScene, GameScene]
});
