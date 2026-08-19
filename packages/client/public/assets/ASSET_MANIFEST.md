# Asset Manifest

Terrain renders from a licensed Tiled tilemap synced from `tile_maps/` at dev/build
time. See [ADR-0010](../../../../specs/architecture/decisions/0010-licensed-tileset-terrain.md).

## Character sprites — in progress

The previous placeholder Mage/Knight art has been removed. Characters are being
replaced with **Knight** and **Templar** art from a new, paid tileset. Like terrain
(see ADR-0010), this art is licensed and kept out of the repo — the source files live
in the git-ignored `character_art/` folder at the repo root and get synced into
`sprites/` and `portraits/` at dev/build time by
`packages/client/scripts/sync-character-art.mjs`. See `character_art/README.md`.

Expected files once added (in `character_art/`, synced to the paths below):

| File | Size | Purpose |
|---|---|---|
| `sprites/knight_spritesheet.png` | 96×128 (3 cols × 4 rows, 32×32/frame) | Game-ready Knight animations |
| `sprites/templar_spritesheet.png` | 96×128 (3 cols × 4 rows, 32×32/frame) | Game-ready Templar animations |
| `portraits/knight_portrait.png` / `portraits/templar_portrait.png` | 128×128 | Character-select screen art |

## Spritesheet Layout

Each spritesheet is expected to be a **4 row × 3 column** grid of 32×32 frames
(adjust `PreloadScene.ts` / `registerCharacterAnimations.ts` if the new tileset differs):

- **Rows (top → bottom)**: `down`, `up`, `left`, `right`
- **Columns (left → right)**: `idle`, `stepA`, `stepB`
