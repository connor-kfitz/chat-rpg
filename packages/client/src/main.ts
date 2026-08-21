import Phaser from "phaser";

import "./style.css";
import { MIN_WIDTH, MIN_HEIGHT } from "./config/constants";
import { PreloadScene } from "./scenes/PreloadScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { ServerListScene } from "./scenes/ServerListScene";
import { GameScene } from "./scenes/GameScene";

const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

if (isTouchDevice) {
  const root = document.getElementById("game-root")!;
  root.innerHTML =
    '<div class="unsupported-device">Sorry, this game does not support touch devices yet.<br />' +
    "Please open it on a desktop or laptop with a mouse and keyboard.</div>";
} else {
  new Phaser.Game({
    type: Phaser.WEBGL,
    parent: "game-root",
    backgroundColor: "#141b14",
    pixelArt: true,
    dom: { createContainer: true },
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: window.innerWidth,
      height: window.innerHeight,
      min: { width: MIN_WIDTH, height: MIN_HEIGHT },
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: [PreloadScene, CharacterSelectScene, ServerListScene, GameScene]
  });
}
