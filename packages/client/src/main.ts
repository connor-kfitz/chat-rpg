import Phaser from "phaser";

import { PreloadScene } from "./scenes/PreloadScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { ServerListScene } from "./scenes/ServerListScene";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.WEBGL,
  width: 640,
  height: 480,
  parent: "game-root",
  pixelArt: true,
  dom: { createContainer: true },
  scene: [PreloadScene, CharacterSelectScene, ServerListScene, GameScene]
});
