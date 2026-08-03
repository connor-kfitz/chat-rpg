# 0002 — Phaser for Client Rendering

## Status
Accepted

## Context
The client needs to render an FF1-style tile-grid overworld: a tilemap, animated character sprites, and a camera that follows the local player — purely client-side, no server-side rendering concerns.

## Decision
Use Phaser (Canvas/WebGL) as the rendering engine. It ships built-in tilemap support, sprite animation, and camera-follow, covering everything the MVP needs without custom rendering code.

## Consequences
- Fast path to the target aesthetic with minimal custom rendering/animation code.
- Couples the client to Phaser's scene/game-object model (`CharacterSelectScene` → `ServerListScene` → `GameScene`).
- If the game later needs a very different rendering style (e.g. 3D, or a non-canvas UI-heavy layer), that's a bigger migration than swapping a small utility library.
