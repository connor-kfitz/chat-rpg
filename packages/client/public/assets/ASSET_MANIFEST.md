# Asset Manifest — v0 (procedural placeholder art)

These are hand-coded (not AI-image-generated) 8-bit-style pixel art, built from simple
geometric bands + an auto-outline pass. They're fully usable to build and playtest the
MVP end-to-end — swap them for licensed/commissioned art later without touching game code.

Terrain no longer uses a placeholder — it renders from a licensed Tiled tilemap synced
from `tile_maps/` at dev/build time. See [ADR-0010](../../../../specs/architecture/decisions/0010-licensed-tileset-terrain.md).

## Files

| File | Size | Purpose |
|---|---|---|
| `mage_spritesheet.png` | 96×128 (3 cols × 4 rows, 32×32/frame) | Game-ready Mage animations |
| `knight_spritesheet.png` | 96×128 (3 cols × 4 rows, 32×32/frame) | Game-ready Knight animations |
| `mage_portrait.png` / `knight_portrait.png` | 128×128 | Character-select screen art |
| `*_preview.png` | 384×512 (128px/frame) | Larger versions of the spritesheets, for reviewing detail only — not for the game |

## Spritesheet Layout

Each spritesheet is a **4 row × 3 column** grid of 32×32 frames:

- **Rows (top → bottom)**: `down`, `up`, `left`, `right`
- **Columns (left → right)**: `idle`, `stepA`, `stepB`

### Phaser loading example

```js
this.load.spritesheet('mage', 'assets/mage_spritesheet.png', {
  frameWidth: 32,
  frameHeight: 32,
});

// row 0 = down, row 1 = up, row 2 = left, row 3 = right (3 frames each)
this.anims.create({
  key: 'mage-walk-down',
  frames: this.anims.generateFrameNumbers('mage', { start: 0, end: 2 }),
  frameRate: 6,
  repeat: -1,
});
this.anims.create({
  key: 'mage-walk-up',
  frames: this.anims.generateFrameNumbers('mage', { start: 3, end: 5 }),
  frameRate: 6,
  repeat: -1,
});
this.anims.create({
  key: 'mage-walk-left',
  frames: this.anims.generateFrameNumbers('mage', { start: 6, end: 8 }),
  frameRate: 6,
  repeat: -1,
});
this.anims.create({
  key: 'mage-walk-right',
  frames: this.anims.generateFrameNumbers('mage', { start: 9, end: 11 }),
  frameRate: 6,
  repeat: -1,
});
```

Same pattern for `knight_spritesheet.png`.

## Palette used

- **Mage**: indigo robe, gold trim, warm skin tone
- **Knight**: steel-gray armor, red plume/trim, warm skin tone
- Both characters share a near-black outline (`#121218`) auto-generated around the silhouette

## Known limitations of this v0 pass
- Left/right profile views are a simplified lean, not full side anatomy — reads fine in motion at 32px, less so zoomed in.
- Only 3 walk frames per direction (idle / spread / close) — enough for a readable walk cycle, not a fluid one.
- No idle-breathing or attack/cast animations yet — out of scope until combat is spec'd.

Take a look at the `*_preview.png` files first (they're upscaled 8x for readability) — tell me what to adjust and I'll regenerate.
