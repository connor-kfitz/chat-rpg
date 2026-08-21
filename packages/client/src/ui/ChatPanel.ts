import Phaser from "phaser";

import { socketClient } from "../net/SocketClient";
import { CHAT_MAX_LENGTH } from "../config/constants";

const KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const LOG_WIDTH = 320;
const LOG_HEIGHT = 130;
const INPUT_HEIGHT = 20;
const MARGIN = 8;
const MAX_LOG_LINES = 8;

const MOBILE_BREAKPOINT = 600;

export class ChatPanel {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private logText: Phaser.GameObjects.Text;
  private inputDom: Phaser.GameObjects.DOMElement;
  private enterKey?: Phaser.Input.Keyboard.Key;
  private lines: string[] = [];
  private isOpen = false;
  private handleResize = () => this.layout();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(10_000);

    this.background = scene.add.rectangle(0, 0, LOG_WIDTH, LOG_HEIGHT, 0x000000, 0.5).setOrigin(0, 0);
    this.logText = scene.add.text(MARGIN, MARGIN, "", {
      fontFamily: "monospace",
      fontSize: "12px",
      color: "#ffffff",
      wordWrap: { width: LOG_WIDTH - MARGIN * 2 }
    });
    this.container.add([this.background, this.logText]);

    this.inputDom = scene.add.dom(
      0,
      0,
      "input",
      "height: 18px; font-size: 12px; font-family: monospace; padding: 2px 4px; " +
        "background: rgba(0, 0, 0, 0.5); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.3); " +
        "box-sizing: border-box; outline: none; display: none;"
    );
    this.inputDom.setScrollFactor(0);
    this.inputDom.setDepth(10_001);
    this.inputDom.setOrigin(0, 0);
    (this.inputDom.node as HTMLInputElement).maxLength = CHAT_MAX_LENGTH;
    this.inputDom.addListener("keydown");
    this.inputDom.on("keydown", (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        this.sendCurrentText();
      } else if (event.key === "Escape") {
        event.preventDefault();
        this.close();
      }
    });

    this.enterKey = scene.input.keyboard?.addKey(KeyCodes.ENTER);
    this.enterKey?.on("down", () => {
      if (!this.isOpen) this.open();
    });

    this.layout();
    scene.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize);
  }

  addMessage(displayName: string, text: string): void {
    this.lines.push(`${displayName}: ${text}`);
    if (this.lines.length > MAX_LOG_LINES) {
      this.lines.splice(0, this.lines.length - MAX_LOG_LINES);
    }
    this.logText.setText(this.lines.join("\n"));
  }

  destroy(): void {
    this.scene.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize);
    this.enterKey?.destroy();
    this.inputDom.destroy();
    this.container.destroy();
  }

  private open(): void {
    this.isOpen = true;
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.enabled = false;
      keyboard.disableGlobalCapture();
    }
    const input = this.inputDom.node as HTMLInputElement;
    input.style.display = "block";
    this.inputDom.setVisible(true);
    input.value = "";
    input.focus();
  }

  private close(): void {
    this.isOpen = false;
    const input = this.inputDom.node as HTMLInputElement;
    input.value = "";
    input.blur();
    input.style.display = "none";
    this.inputDom.setVisible(false);
    const keyboard = this.scene.input.keyboard;
    if (keyboard) {
      keyboard.enabled = true;
      keyboard.enableGlobalCapture();
    }
  }

  private sendCurrentText(): void {
    const input = this.inputDom.node as HTMLInputElement;
    const text = input.value.trim();
    if (text) {
      socketClient.send({ type: "chat", text });
    }
    this.close();
  }

  private layout(): void {
    const camera = this.scene.cameras.main;
    const pageOffsetX = (window.innerWidth - this.scene.scale.width) / 2;

    const visibleWidth = Math.min(camera.width, window.innerWidth);
    const panelWidth = visibleWidth < MOBILE_BREAKPOINT ? Math.max(visibleWidth - MARGIN * 2, 0) : LOG_WIDTH;
    const x = MARGIN - pageOffsetX - camera.x;
    const y = camera.height - LOG_HEIGHT - INPUT_HEIGHT - MARGIN * 2;

    this.background.width = panelWidth;
    this.logText.setWordWrapWidth(Math.max(panelWidth - MARGIN * 2, 0));

    this.container.setPosition(x, y);
    (this.inputDom.node as HTMLInputElement).style.width = `${panelWidth}px`;
    this.inputDom.updateSize();
    this.inputDom.setPosition(
      camera.x + x - 2,
      camera.y + camera.height - INPUT_HEIGHT - MARGIN
    );
  }
}
