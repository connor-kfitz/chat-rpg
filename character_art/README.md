# Character Art (paid, not committed to git)

This folder holds the licensed/paid character spritesheets and portraits. Like
`tile_maps/` (see [ADR-0010](../specs/architecture/decisions/0010-licensed-tileset-terrain.md)),
it's git-ignored — these files must never be committed to the repo. They're mirrored to
Vercel Blob out-of-band and pulled down at dev/build time by
`packages/client/scripts/sync-character-art.mjs`.

## Expected files

Drop the exported PNGs directly in this folder, named:

| File | Size | Purpose |
|---|---|---|
| `knight_spritesheet.png` | 96×128 (3 cols × 4 rows, 32×32/frame) | Knight walk animations |
| `templar_spritesheet.png` | 96×128 (3 cols × 4 rows, 32×32/frame) | Templar walk animations |
| `knight_portrait.png` | 128×128 | Character-select screen art |
| `templar_portrait.png` | 128×128 | Character-select screen art |

Spritesheet layout (adjust `PreloadScene.ts` / `registerCharacterAnimations.ts` if your
tileset differs):

- **Rows (top → bottom)**: `down`, `up`, `left`, `right`
- **Columns (left → right)**: `idle`, `stepA`, `stepB`

## Syncing

- Local dev: just drop the files here — `npm run dev` (via `predev`) copies them into
  `packages/client/public/assets/{sprites,portraits}/` automatically.
- Deploy/CI: upload the same files to Vercel Blob under the `character_art/` prefix (the
  same way `tile_maps/` is mirrored) so `sync-character-art.mjs` can pull them down at
  build time via `BLOB_READ_WRITE_TOKEN`.
