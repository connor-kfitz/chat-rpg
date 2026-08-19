#!/usr/bin/env node
// Copies licensed character spritesheets/portraits from the repo-root character_art/ folder
// into the client's public assets. See specs/architecture/decisions/0010-licensed-tileset-terrain.md
// (character art follows the same out-of-repo, synced-at-build pattern as terrain tilesets).
import { existsSync, mkdirSync, readdirSync, copyFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const ROOT = dirname(dirname(CLIENT_DIR));
const SOURCE_DIR = join(ROOT, "character_art");
const SPRITES_OUT_DIR = join(ROOT, "packages", "client", "public", "assets", "sprites");
const PORTRAITS_OUT_DIR = join(ROOT, "packages", "client", "public", "assets", "portraits");
const BLOB_PREFIX = "character_art/";

for (const envFile of [join(ROOT, ".env"), join(ROOT, ".env.local")]) {
  if (existsSync(envFile)) process.loadEnvFile(envFile);
}

/**
 * The paid character art can't live in git, so CI/deploy environments have nothing under
 * character_art/ unless we fetch it from somewhere at build time. We mirror that folder into
 * Vercel Blob out-of-band and pull it down here before falling back to whatever's already on
 * disk (the normal path for local dev, where the licensed files are kept manually).
 */
async function syncFromBlob() {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("sync-character-art: BLOB_READ_WRITE_TOKEN not set — using character_art/ as-is on disk.");
    return;
  }

  const { list } = await import("@vercel/blob");
  let cursor;
  let count = 0;
  do {
    const page = await list({ prefix: BLOB_PREFIX, cursor, token: process.env.BLOB_READ_WRITE_TOKEN });
    for (const blob of page.blobs) {
      const destPath = join(ROOT, blob.pathname);
      mkdirSync(dirname(destPath), { recursive: true });
      const res = await fetch(blob.url, {
        headers: { authorization: `Bearer ${process.env.BLOB_READ_WRITE_TOKEN}` }
      });
      if (!res.ok) {
        throw new Error(`sync-character-art: failed to download ${blob.pathname} from Blob (${res.status})`);
      }
      writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
      count++;
    }
    cursor = page.cursor;
  } while (cursor);

  console.log(`sync-character-art: pulled ${count} file(s) from Vercel Blob -> character_art/`);
}

async function main() {
  await syncFromBlob();

  if (!existsSync(SOURCE_DIR)) {
    console.log("sync-character-art: no character_art/ directory found — skipping.");
    return;
  }

  mkdirSync(SPRITES_OUT_DIR, { recursive: true });
  mkdirSync(PORTRAITS_OUT_DIR, { recursive: true });

  let count = 0;
  for (const file of readdirSync(SOURCE_DIR)) {
    if (!file.toLowerCase().endsWith(".png")) continue;

    if (file.endsWith("_spritesheet.png")) {
      copyFileSync(join(SOURCE_DIR, file), join(SPRITES_OUT_DIR, file));
      count++;
    } else if (file.endsWith("_portrait.png")) {
      copyFileSync(join(SOURCE_DIR, file), join(PORTRAITS_OUT_DIR, file));
      count++;
    } else {
      console.warn(`sync-character-art: skipping "${file}" — expected a "*_spritesheet.png" or "*_portrait.png" name.`);
    }
  }

  console.log(`sync-character-art: synced ${count} file(s) -> packages/client/public/assets/{sprites,portraits}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
