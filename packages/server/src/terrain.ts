import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const MAP_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../../../tile_maps/capybara-forest.tmj");

const COLLISION_LAYER_NAME = "Collision";

interface TiledLayer {
  name: string;
  data: number[];
  width: number;
  height: number;
}

interface TiledMap {
  width: number;
  height: number;
  layers: TiledLayer[];
}

export interface Terrain {
  width: number;
  height: number;
  walkable: boolean[][];
}

export function loadTerrain(mapPath: string = MAP_PATH): Terrain {
  const map: TiledMap = JSON.parse(readFileSync(mapPath, "utf-8"));
  const collisionLayer = map.layers.find((l) => l.name === COLLISION_LAYER_NAME);
  if (!collisionLayer) {
    throw new Error(`${mapPath} has no "${COLLISION_LAYER_NAME}" layer — cannot build the walkable grid.`);
  }

  const walkable: boolean[][] = Array.from({ length: map.height }, (_, y) =>
    Array.from({ length: map.width }, (_, x) => collisionLayer.data[y * map.width + x] === 0)
  );

  return { width: map.width, height: map.height, walkable };
}
