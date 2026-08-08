export interface AnimalSpriteDef {
  /** Must match a TILESET_MANIFEST entry's `name` and the Tiled tileset placed on the map's "Animals" layer. */
  name: string;
  key: string;
  frameWidth: number;
  frameHeight: number;
  frameCount: number;
  frameRate: number;
}

export const ANIMAL_SPRITES: AnimalSpriteDef[] = [
  { name: "Kapybara_Dive", key: "kapybara-dive", frameWidth: 32, frameHeight: 32, frameCount: 9, frameRate: 10 },
  {
    name: "Kapybara_LookAround",
    key: "kapybara-lookaround",
    frameWidth: 32,
    frameHeight: 32,
    frameCount: 10,
    frameRate: 8
  },
  { name: "Kapybara_Idle", key: "kapybara-idle", frameWidth: 32, frameHeight: 32, frameCount: 9, frameRate: 6 }
];
