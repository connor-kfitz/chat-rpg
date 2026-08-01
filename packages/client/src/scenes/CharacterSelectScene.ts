import Phaser from "phaser";

import type { CharacterClass } from "@fantasy-grid/shared";
import { sessionStore } from "../state/sessionStore";

interface CharacterOption {
  characterClass: CharacterClass;
  displayName: string;
  flavorText: string;
  portraitKey: string;
  x: number;
}

const OPTIONS: CharacterOption[] = [
  {
    characterClass: "mage",
    displayName: "Mage",
    flavorText: "Wields arcane power from the forest's edge.",
    portraitKey: "mage_portrait",
    x: 200
  },
  {
    characterClass: "knight",
    displayName: "Knight",
    flavorText: "Stands ready with steel and shield.",
    portraitKey: "knight_portrait",
    x: 440
  }
];

const PORTRAIT_Y = 150;
const HIGHLIGHT_PADDING = 8;

export class CharacterSelectScene extends Phaser.Scene {
  private selectedClass: CharacterClass | null = null;
  private highlight!: Phaser.GameObjects.Graphics;
  private nameInput!: Phaser.GameObjects.DOMElement;
  private confirmButton!: Phaser.GameObjects.Text;
  private portraitsByClass = new Map<CharacterClass, Phaser.GameObjects.Image>();

  constructor() {
    super("CharacterSelectScene");
  }

  create(): void {
    this.selectedClass = null;

    this.add
      .text(this.scale.width / 2, 40, "Choose Your Character", { fontFamily: "monospace", fontSize: "20px" })
      .setOrigin(0.5, 0.5);

    this.highlight = this.add.graphics();

    for (const option of OPTIONS) {
      const portrait = this.add.image(option.x, PORTRAIT_Y, option.portraitKey);
      portrait.setInteractive({ useHandCursor: true });
      portrait.on("pointerdown", () => this.selectCharacter(option.characterClass));
      this.portraitsByClass.set(option.characterClass, portrait);

      this.add
        .text(option.x, PORTRAIT_Y + 90, option.displayName, { fontFamily: "monospace", fontSize: "16px" })
        .setOrigin(0.5, 0.5);

      this.add
        .text(option.x, PORTRAIT_Y + 115, option.flavorText, {
          fontFamily: "monospace",
          fontSize: "11px",
          color: "#cccccc",
          align: "center",
          wordWrap: { width: 200 }
        })
        .setOrigin(0.5, 0.5);
    }

    this.add
      .text(this.scale.width / 2, 330, "Display name:", { fontFamily: "monospace", fontSize: "14px" })
      .setOrigin(0.5, 0.5);

    this.nameInput = this.add.dom(
      this.scale.width / 2,
      360,
      "input",
      "width: 200px; height: 24px; font-size: 14px; font-family: monospace; text-align: center;"
    );
    (this.nameInput.node as HTMLInputElement).maxLength = 20;
    this.nameInput.addListener("input");
    this.nameInput.on("input", () => this.refreshConfirmState());

    this.confirmButton = this.add
      .text(this.scale.width / 2, 420, "Confirm", {
        fontFamily: "monospace",
        fontSize: "18px",
        backgroundColor: "#333333",
        padding: { x: 16, y: 8 }
      })
      .setOrigin(0.5, 0.5);
    this.confirmButton.on("pointerdown", () => this.confirm());

    this.refreshConfirmState();
  }

  private selectCharacter(characterClass: CharacterClass): void {
    this.selectedClass = characterClass;
    const portrait = this.portraitsByClass.get(characterClass)!;
    const bounds = portrait.getBounds();
    this.highlight.clear();
    this.highlight.lineStyle(3, 0xffdd55, 1);
    this.highlight.strokeRect(
      bounds.x - HIGHLIGHT_PADDING,
      bounds.y - HIGHLIGHT_PADDING,
      bounds.width + HIGHLIGHT_PADDING * 2,
      bounds.height + HIGHLIGHT_PADDING * 2
    );
    this.refreshConfirmState();
  }

  private currentName(): string {
    return (this.nameInput.node as HTMLInputElement).value.trim();
  }

  private refreshConfirmState(): void {
    const enabled = this.selectedClass !== null && this.currentName().length > 0;
    this.confirmButton.setAlpha(enabled ? 1 : 0.5);
    if (enabled) {
      this.confirmButton.setInteractive({ useHandCursor: true });
    } else {
      this.confirmButton.disableInteractive();
    }
  }

  private confirm(): void {
    if (!this.selectedClass || this.currentName().length === 0) return;
    sessionStore.characterClass = this.selectedClass;
    sessionStore.displayName = this.currentName();
    this.scene.start("ServerListScene");
  }
}
