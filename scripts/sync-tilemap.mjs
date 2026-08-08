#!/usr/bin/env node
// Merges the licensed Tiled map's external .tsx tileset references into a single
// embedded-tileset JSON Phaser can load directly, and copies the tileset PNGs into
// the client's public assets. See specs/architecture/decisions/0010-licensed-tileset-terrain.md.
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MAP_PATH = join(ROOT, "tile_maps", "capybara-forest.tmj");
const TILESETS_DIR = join(ROOT, "tile_maps", "capybara-forest");
const OUT_DIR = join(ROOT, "packages", "client", "public", "assets", "tilemaps");
const OUT_MAP_PATH = join(OUT_DIR, "world.tmj");
const OUT_TILESETS_DIR = join(OUT_DIR, "capybara-forest");
const MANIFEST_PATH = join(ROOT, "packages", "client", "src", "generated", "tilesetManifest.ts");

// Layers the client never renders (see GameScene's MAP_LAYER_NAMES and
// specs/architecture/overview.md#terrain--collision). The server reads collision straight from
// the root tile_maps/capybara-forest.tmj, so the client's synced copy doesn't need this layer —
// and Phaser's Tiled parser walks every layer's tile data up front (even ones never drawn) to
// build its tile-property index, so leaving it in would require every GID it uses to also have
// a matching embedded tileset.
const NON_RENDERED_LAYERS = ["Collision"];

function attr(tag, name) {
  const m = tag.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : undefined;
}

function parseTilesetXml(tsxPath) {
  const xml = readFileSync(tsxPath, "utf-8");
  const tilesetTag = xml.match(/<tileset\b[^>]*>/)?.[0];
  const imageTag = xml.match(/<image\b[^>]*\/>/)?.[0];
  
  if (!tilesetTag || !imageTag) {
    throw new Error(`Unexpected tileset XML shape in ${tsxPath} — expected a single <tileset> with one <image/>.`);
  }

  const name = attr(tilesetTag, "name");
  const tilewidth = Number(attr(tilesetTag, "tilewidth"));
  const tileheight = Number(attr(tilesetTag, "tileheight"));
  const tilecount = Number(attr(tilesetTag, "tilecount"));
  const columns = Number(attr(tilesetTag, "columns"));
  const imageSource = attr(imageTag, "source");
  const imagewidth = Number(attr(imageTag, "width"));
  const imageheight = Number(attr(imageTag, "height"));

  if (!name || !tilewidth || !tileheight || !tilecount || !columns || !imageSource || !imagewidth || !imageheight) {
    throw new Error(`Failed to fully parse tileset attributes from ${tsxPath}: ${JSON.stringify({ name, tilewidth, tileheight, tilecount, columns, imageSource, imagewidth, imageheight })}`);
  }

  return { name, tilewidth, tileheight, tilecount, columns, imageSource, imagewidth, imageheight };
}

function toUrlPath(...parts) {
  return parts.join("/").split(sep).join("/");
}

/** Maps .tsx basename -> absolute path, for every .tsx found anywhere under `rootDir`. */
function buildTsxIndex(rootDir) {
  const index = new Map();
  if (!existsSync(rootDir)) return index;
  for (const entry of readdirSync(rootDir, { recursive: true })) {
    if (entry.toLowerCase().endsWith(".tsx")) index.set(basename(entry), join(rootDir, entry));
  }
  return index;
}

/**
 * Tiled writes each tileset's `source` relative to wherever the .tmj lives on the *author's* own
 * disk, not this repo's layout — so re-saving the map from Tiled can rewrite working paths (e.g.
 * "capybara-forest/grass/Grass_Tiles_1.tsx") into ones that don't resolve here (e.g.
 * "chat-rpg/grass/Grass_Tiles_1.tsx"). Rather than hand-fixing the .tmj after every save, fall
 * back to a filename match anywhere under tile_maps/capybara-forest/ before giving up.
 */
function resolveTsxPath(entry, tsxIndex) {
  const declared = join(dirname(MAP_PATH), entry.source);
  if (existsSync(declared)) return declared;

  const fallback = tsxIndex.get(basename(entry.source));
  if (fallback) {
    console.warn(`sync-tilemap: tileset source "${entry.source}" doesn't resolve from the .tmj's location — using ${relative(ROOT, fallback)} instead (matched by filename).`);
    return fallback;
  }

  return null;
}

function main() {
  if (!existsSync(MAP_PATH)) {
    throw new Error(`Map not found at ${MAP_PATH} — the licensed tile_maps/ content must be present locally (see ADR-0010). Nothing to sync.`);
  }

  const map = JSON.parse(readFileSync(MAP_PATH, "utf-8"));
  const clientLayers = map.layers.filter((l) => !NON_RENDERED_LAYERS.includes(l.name));
  const manifest = [];
  const tsxIndex = buildTsxIndex(TILESETS_DIR);

  // A tileset can be referenced only by a non-rendered layer (e.g. the collision marker tile)
  // without its licensed .tsx/image being available locally yet — skip and warn instead of
  // failing the whole sync, since the client's copy (clientLayers, above) never uses it.
  const embeddedTilesets = map.tilesets.flatMap((entry) => {
    const tsxPath = resolveTsxPath(entry, tsxIndex);
    if (!tsxPath) {
      console.warn(`sync-tilemap: skipping tileset "${entry.source}" (no matching .tsx found under ${relative(ROOT, TILESETS_DIR)}) — collision-only tilesets don't need to be present for the client to render.`);
      return [];
    }
    const parsed = parseTilesetXml(tsxPath);

    const relDir = relative(TILESETS_DIR, dirname(tsxPath));
    const destDir = join(OUT_TILESETS_DIR, relDir);
    mkdirSync(destDir, { recursive: true });
    copyFileSync(join(dirname(tsxPath), parsed.imageSource), join(destDir, parsed.imageSource));

    const key = `terrain_${parsed.name}`;
    manifest.push({
      name: parsed.name,
      key,
      url: "/" + toUrlPath("assets", "tilemaps", "capybara-forest", relDir, parsed.imageSource)
    });

    return [{
      firstgid: entry.firstgid,
      name: parsed.name,
      tilewidth: parsed.tilewidth,
      tileheight: parsed.tileheight,
      tilecount: parsed.tilecount,
      columns: parsed.columns,
      image: parsed.imageSource,
      imagewidth: parsed.imagewidth,
      imageheight: parsed.imageheight,
      margin: 0,
      spacing: 0
    }];
  });

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_MAP_PATH, JSON.stringify({ ...map, layers: clientLayers, tilesets: embeddedTilesets }, null, 1));

  mkdirSync(dirname(MANIFEST_PATH), { recursive: true });
  const manifestLines = manifest
    .map((e) => `  { name: ${JSON.stringify(e.name)}, key: ${JSON.stringify(e.key)}, url: ${JSON.stringify(e.url)} }`)
    .join(",\n");
  writeFileSync(
    MANIFEST_PATH,
    `// AUTO-GENERATED by scripts/sync-tilemap.mjs — do not edit by hand.\n` +
      `export interface TilesetManifestEntry {\n  name: string;\n  key: string;\n  url: string;\n}\n\n` +
      `export const TILESET_MANIFEST: TilesetManifestEntry[] = [\n${manifestLines}\n];\n`
  );

  console.log(`sync-tilemap: embedded ${embeddedTilesets.length} tilesets -> ${relative(ROOT, OUT_MAP_PATH)}`);
  console.log(`sync-tilemap: wrote manifest -> ${relative(ROOT, MANIFEST_PATH)}`);
}

main();
