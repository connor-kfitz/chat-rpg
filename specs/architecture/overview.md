# Architecture Overview

This describes the system **as currently built**. Keep it accurate as the code changes — it is not a historical record. For *why* a particular choice was made over its alternatives, follow the ADR links; this doc only needs to state current reality.

## Stack

| Layer | Choice | ADR |
|---|---|---|
| Client rendering | Phaser (Canvas/WebGL) | [0002](decisions/0002-phaser-for-client-rendering.md) |
| Client transport | Native WebSocket API | — (matches `ws` server; no client library needed) |
| Server runtime | Node.js + TypeScript | — |
| WebSocket library | `ws` | [0003](decisions/0003-ws-over-socketio.md) |
| State storage | In-memory (`Map` per process) | [0006](decisions/0006-in-memory-state.md) |
| Message format | JSON | — (human-readable, easy to debug at this scale) |

## Repository Structure

Monorepo, npm workspaces. See [ADR-0001](decisions/0001-monorepo-structure.md) for why.

```
/
├── packages/
│   ├── client/                  # Phaser app
│   │   ├── public/
│   │   │   └── assets/
│   │   │       ├── sprites/     # mage_spritesheet.png, knight_spritesheet.png
│   │   │       ├── portraits/   # mage_portrait.png, knight_portrait.png
│   │   │       ├── tilemaps/    # synced from tile_maps/ (git-ignored, see ADR-0010)
│   │   │       └── ASSET_MANIFEST.md
│   │   └── src/
│   │       └── scenes/          # CharacterSelectScene, ServerListScene, GameScene
│   ├── server/                  # Node + ws server
│   │   └── src/
│   │       ├── rooms/           # Room registry, GameState
│   │       └── protocol/        # message handlers (join_room, move, leave_room)
│   └── shared/                  # source of truth for both sides
│       └── src/
│           ├── types.ts         # Player, Room, CharacterClass, Direction
│           └── messages.ts      # WebSocket message payload types
├── tile_maps/                   # licensed terrain source of truth, git-ignored (ADR-0010)
│   ├── capybara-forest.tmj              # tracked — Tiled map document, no image data
│   └── capybara-forest/          # git-ignored — tileset .tsx files + source images
├── specs/                       # this spec set
├── package.json                 # workspace root
└── tsconfig.base.json
```

Character sprite/portrait assets ship as static files under `packages/client/public/assets/` — Phaser loads them directly, no build step needed for the images themselves. Terrain assets are licensed and git-ignored; see [ADR-0010](decisions/0010-licensed-tileset-terrain.md) for how they're sourced and synced into the client's public assets at dev/build time.

## Client Architecture

- **Screens**: `CharacterSelectScene` → `ServerListScene` → `GameScene` (Phaser scenes). See [features/001](../features/001-character-select/spec.md), [002](../features/002-server-join/spec.md), [003](../features/003-movement/spec.md).
- **GameScene** owns:
  - A tilemap render of the world grid, loaded from the licensed Tiled map (`capybara-forest.tmj`, 30×30 tiles at 16px/tile — see [ADR-0010](decisions/0010-licensed-tileset-terrain.md)), across its four base layers (`Terrain`, `Terrain Shadows`, `Objects`, `Objects Two`) plus an `Above Player` layer rendered above every player sprite (see [Player Occlusion](#player-occlusion)).
  - A camera that scrolls and centers on the local player once the grid exceeds the viewport.
  - A sprite per connected player, keyed by `playerId`, facing one of 4 directions (`Direction`), depth-sorted by grid Y so players higher on screen draw behind ones lower down (see [Player Occlusion](#player-occlusion)).
  - Input handling (arrow keys/WASD) → sends `move` intents; does **not** move the local sprite until the server confirms (prevents client/server desync — see [ADR-0005](decisions/0005-server-authoritative-movement.md)).
  - A WebSocket connection manager that dispatches incoming events into scene state.

## Server Architecture

- A single Node process hosts:
  - An HTTP server (serves static client assets) with a WebSocket upgrade path.
  - A room registry: `Map<serverId, Room>`. Only one `Room` ("forest-1") is registered at launch, but the abstraction supports more without a rewrite ([ADR-0008](decisions/0008-multi-room-registry.md)).
  - Each `Room` owns its own `GameState`: grid dimensions, a walkable-tile grid derived from the map's terrain (see [Terrain & Collision](#terrain--collision)), and a `Map<playerId, Player>`.
- **Update model**: event-driven, not a fixed-tick simulation. See [ADR-0004](decisions/0004-event-driven-update-model.md).
- **Authority model**: server is the single source of truth. Clients send *intents* (`move: "up"`), never positions. See [ADR-0005](decisions/0005-server-authoritative-movement.md).

## Data Model

```ts
type CharacterClass = "mage" | "knight"
type Direction = "up" | "down" | "left" | "right"

interface Player {
  id: string              // server-generated
  displayName: string
  characterClass: CharacterClass
  position: { x: number; y: number }
  facing: Direction
  connectedAt: number
}

interface Room {
  id: string                                   // e.g. "forest-1"
  name: string                                  // e.g. "Forest Server"
  gridSize: { width: number; height: number }   // 30x30, from capybara-forest.tmj
  players: Map<string, Player>
  maxPlayers: number                            // e.g. 50
}
```

`tileType` is gone from `Room` — terrain is no longer a single uniform value. The server instead holds a walkable-tile grid built from the map at load time; see [Terrain & Collision](#terrain--collision).

## WebSocket Protocol

### Client → Server

| Type | Payload | Notes |
|---|---|---|
| `join_room` | `{ roomId, displayName, characterClass }` | Sent once, immediately after the socket opens |
| `move` | `{ direction: Direction }` | Sent per input; cooldown enforced server-side |
| `leave_room` | `{}` | Optional explicit leave; otherwise inferred from disconnect |

### Server → Client

| Type | Payload | Notes |
|---|---|---|
| `join_ack` | `{ playerId, room: { gridSize, players: Player[] } }` | Full state snapshot, sent only to the joining client. Terrain/collision data isn't pushed here — the client loads the same map file directly (see [Terrain & Collision](#terrain--collision)) |
| `player_joined` | `{ player: Player }` | Broadcast to everyone else in the room |
| `player_moved` | `{ playerId, position, facing }` | Broadcast on every accepted move |
| `player_left` | `{ playerId }` | Broadcast on disconnect/leave |
| `error` | `{ code, message }` | e.g. `ROOM_FULL`, `NAME_TAKEN`, `INVALID_MOVE` |

## Movement Validation Rules
1. Destination tile must be within `[0, gridSize.width) × [0, gridSize.height)`.
2. Reject moves within the cooldown window (~150–200ms) of the player's last accepted move (server-side timestamp — never trust a client-sent time).
3. Destination tile must be walkable — see [Terrain & Collision](#terrain--collision). No player-vs-player collision (stacking allowed).

## Terrain & Collision
The world map (`tile_maps/capybara-forest.tmj`) is authored in Tiled across four base layers — `Terrain` (base ground/water/cliff), `Terrain Shadows`, `Objects`, `Objects Two` (trees, fences, benches, well, bridges, hedges) — plus two special-purpose layers, `Collision` (below) and `Above Player` (see [Player Occlusion](#player-occlusion)). See [ADR-0010](decisions/0010-licensed-tileset-terrain.md) for why these assets live outside the repo.

- **Walkability is authored directly in Tiled**, per-tile: the `Collision` layer (hidden — `visible:false`, never rendered by the client), marks each blocked tile with a solid fill; an empty cell (GID `0`) is walkable. This replaced an earlier code-side per-tileset config (`packages/server/src/terrain.ts`'s old `TILESET_WALKABILITY` table) that could only mark a whole tileset walkable or blocked and couldn't express the mixed blocking/walkable tiles within `Water_Stone_Tile_1` and `Stone_Cliff_1_Tile` — see [005 — World Terrain](../features/005-world-terrain/spec.md).
- **Server** parses `tile_maps/capybara-forest.tmj` (plain JSON) at `Room` startup, reads the `Collision` layer's `data` array, and builds an in-memory `boolean[][]` walkable grid: a tile is walkable iff its `Collision` cell is `0`. This grid is what [Movement Validation Rule 3](#movement-validation-rules) checks — the server needs local access to `tile_maps/` for this, same as the client (see ADR-0010's consequences).
- **Client** loads the same map file to render terrain but excludes `Collision` from the layers it draws (see `GameScene`'s rendered layer list) — it's data-only. The client doesn't need collision pushed over the wire either — a rejected move already falls out of the existing flow (no `player_moved` broadcast; same as an off-grid rejection).
- No new WebSocket message types are introduced for terrain — collision reuses the existing move-rejection path.
- **Asset sync caveat**: Tiled writes each tileset's `source` path relative to wherever the map author has the `.tmj` open on their own disk, which doesn't necessarily match this repo's `tile_maps/capybara-forest/` layout — re-saving the map from Tiled can rewrite previously-working relative paths. `scripts/sync-tilemap.mjs` tolerates this: if a declared `source` doesn't resolve, it falls back to a filename match anywhere under `tile_maps/capybara-forest/` before giving up (with a console warning either way).

## Player Occlusion
An `Above Player` layer (visible, rendered last) holds the parts of tall map elements — tree canopies, a well's rim — that should draw *over* a player standing near their base, so the player reads as behind the object instead of on top of it.

- **Depth model**: each player's container is depth-sorted by its grid Y position (`PlayerEntity.setDepth(position.y)`), so players higher on screen (smaller Y) draw behind ones lower down, matching top-down perspective. `Above Player` is set to a depth equal to the grid height — strictly greater than any possible player Y — so it always draws above every player, everywhere on the map.
- This is purely a client-side rendering concern: it doesn't affect collision (still driven by the separate `Collision` layer) or any server state.

## Reconnect Handling
- Client holds its `playerId` + `roomId` for the session.
- On disconnect, server keeps the player's slot for a grace period (default 60s) before freeing it, so a page refresh doesn't kick the player from the world.
- **Status:** not yet implemented — see the TODO in `packages/server/src/index.ts`.

## Deployment Notes (MVP)
- A single Node process is sufficient — no horizontal scaling, message broker, or sticky sessions needed at this scale.
- No database required.
- Once this leaves localhost, run behind a reverse proxy with TLS (WSS) — browsers require secure WebSocket connections from HTTPS pages.
