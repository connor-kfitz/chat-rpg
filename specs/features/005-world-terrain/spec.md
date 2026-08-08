# 005 — World Terrain

## Status
In Progress

## Summary
As a player, I want to explore a world with varied, real terrain (grass, water, cliffs, a bridge, trees, and other decorations) instead of a single flat tile, and have obstacles actually block my movement, so the world feels like a real place instead of an empty grid.

## Acceptance Criteria
- [x] `GameScene` renders the licensed Tiled map (`tile_maps/capybara-forest.tmj`, 30×30 tiles at 16px/tile) across its four base visual layers (`Terrain`, `Terrain Shadows`, `Objects`, `Objects Two`) in place of the single repeated `forest_tile.png`. A fifth layer, `Collision`, is data-only (hidden in Tiled, excluded from `GameScene`'s rendered layers) and exists solely to drive the walkable grid below. A sixth layer, `Above Player`, is rendered above every player sprite so tree canopies and similar tall elements visually occlude a player standing near their base — see [architecture: Player Occlusion](../../architecture/overview.md#player-occlusion).
- [x] Tiles marked on the map's hidden `Collision` layer reject a move into them, mirroring the existing off-grid rejection: no `player_moved` broadcast, sprite still updates facing direction.
- [x] Walkable terrain (grass, the stone bridge surface, shore stones/plateau tops within the water-stone and cliff tilesets, etc.) behaves exactly as movement did before this feature — no regression for the open-field case, now expressed precisely per-tile via the `Collision` layer instead of a whole-tileset default.
- [x] Server validates terrain collision using a walkable grid built from the map at `Room` startup (see [architecture: Terrain & Collision](../../architecture/overview.md#terrain--collision)) — not just a client-side visual restriction.
- [x] `forest_tile.png` and its references are removed from `packages/client/public/assets/sprites/` and `ASSET_MANIFEST.md`.
- [x] Mage/Knight sprites, animations, and portraits are unchanged by this feature.

## Out of Scope
- Replacing character art — Mage/Knight remain the existing placeholder sprites/portraits until a licensed or commissioned replacement is sourced.
- Multiple maps/rooms with different terrain — still one hardcoded room (`forest-1`) per [ADR-0008](../../architecture/decisions/0008-multi-room-registry.md).
- Animated tiles (e.g. flowing water/waterfall animation), interactable decorations (sitting on a bench, drawing from the well), or a mapping/level-editor workflow for non-developers.
- Diagonal movement or sub-tile positioning — movement stays one tile at a time per [003 — Movement](../003-movement/spec.md).

## Related
- Architecture: [Terrain & Collision](../../architecture/overview.md#terrain--collision), [Movement Validation Rules](../../architecture/overview.md#movement-validation-rules), [Data Model](../../architecture/overview.md#data-model) (`Room`)
- ADRs: [0009 — Original/Licensed Art](../../architecture/decisions/0009-original-art-direction.md), [0010 — Licensed Tileset for Terrain](../../architecture/decisions/0010-licensed-tileset-terrain.md)
- Extends: [003 — Movement](../003-movement/spec.md)
- Promoted from: `roadmap.md`'s former "Terrain Variety" backlog entry
