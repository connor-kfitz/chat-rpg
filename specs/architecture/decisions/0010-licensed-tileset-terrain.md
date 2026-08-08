# 0010 — Licensed Tileset for Terrain, Kept Out of the Repo

## Status
Accepted

## Context
[ADR-0009](0009-original-art-direction.md) requires all shipped art to be original, commissioned, or properly licensed — never extracted from Square Enix's actual Final Fantasy assets. Terrain was still using a single procedural placeholder tile (`forest_tile.png`, see [product/overview.md](../../product/overview.md)'s former "no terrain variety" non-goal).

A licensed tileset (organized locally under `tile_maps/capybara-forest/`, authored as a Tiled map at `tile_maps/capybara-forest.tmj`) now provides real terrain variety: grass, water/waterfall, stone cliffs, a cave entrance, a stone bridge, trees, fences, hedges, and outdoor decorations (benches, well). The pack's license does not permit public redistribution of the source images/tileset files.

## Decision
- Terrain assets (the `.tsx` tileset files and their source images, plus the `.tmj` map) live in `tile_maps/` at the repo root and are **git-ignored** (`tile_maps/capybara-forest/*`) — only `.gitkeep` placeholders and the folder structure are tracked. `tile_maps/capybara-forest.tmj` itself (the map document, no embedded image data) is tracked.
- `tile_maps/` is the single source of truth for terrain assets. The client build/dev process syncs (copies) the needed files into `packages/client/public/assets/tilemaps/` at dev-server start / build time; that synced copy is also git-ignored, so nothing licensed ever reaches version control.
- Character art (`mage_spritesheet.png`, `knight_spritesheet.png`, portraits) is **not** replaced by this change — it remains the placeholder art described in `ASSET_MANIFEST.md` until a licensed or commissioned replacement is sourced. See [roadmap.md](../../roadmap.md).
- `forest_tile.png` becomes obsolete once terrain renders from the real tilemap and should be removed from `packages/client/public/assets/sprites/` and `ASSET_MANIFEST.md` when [features/005 — World Terrain](../../features/005-world-terrain/spec.md) is implemented.

## Consequences
- Anyone cloning the repo needs the licensed tileset files locally (obtained out-of-band) before the client will render terrain correctly — the client should fail gracefully (or the README should document this) rather than silently showing a blank map.
- Deploy/CI environments need the same out-of-band asset provisioning step, since the assets can't be pulled from git.
- Server-side terrain collision (see [features/005](../../features/005-world-terrain/spec.md)) requires the server to also have local access to `tile_maps/` at startup, for the same licensing reason — not just the client.
