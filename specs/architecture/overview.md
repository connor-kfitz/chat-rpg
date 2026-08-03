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
│   │   │       ├── sprites/     # mage_spritesheet.png, knight_spritesheet.png, forest_tile.png
│   │   │       ├── portraits/   # mage_portrait.png, knight_portrait.png
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
├── specs/                       # this spec set
├── package.json                 # workspace root
└── tsconfig.base.json
```

Sprite/tile assets ship as static files under `packages/client/public/assets/` — Phaser loads them directly, no build step needed for the images themselves.

## Client Architecture

- **Screens**: `CharacterSelectScene` → `ServerListScene` → `GameScene` (Phaser scenes). See [features/001](../features/001-character-select/spec.md), [002](../features/002-server-join/spec.md), [003](../features/003-movement/spec.md).
- **GameScene** owns:
  - A tilemap render of the N×N forest grid (default 20×20, 32px tiles).
  - A camera that scrolls and centers on the local player once the grid exceeds the viewport.
  - A sprite per connected player, keyed by `playerId`, facing one of 4 directions (`Direction`).
  - Input handling (arrow keys/WASD) → sends `move` intents; does **not** move the local sprite until the server confirms (prevents client/server desync — see [ADR-0005](decisions/0005-server-authoritative-movement.md)).
  - A WebSocket connection manager that dispatches incoming events into scene state.

## Server Architecture

- A single Node process hosts:
  - An HTTP server (serves static client assets) with a WebSocket upgrade path.
  - A room registry: `Map<serverId, Room>`. Only one `Room` ("forest-1") is registered at launch, but the abstraction supports more without a rewrite ([ADR-0008](decisions/0008-multi-room-registry.md)).
  - Each `Room` owns its own `GameState`: grid dimensions, tile type, and a `Map<playerId, Player>`.
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
  gridSize: { width: number; height: number }   // default 20x20
  tileType: "forest"                            // only value in MVP
  players: Map<string, Player>
  maxPlayers: number                            // e.g. 50
}
```

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
| `join_ack` | `{ playerId, room: { gridSize, tileType, players: Player[] } }` | Full state snapshot, sent only to the joining client |
| `player_joined` | `{ player: Player }` | Broadcast to everyone else in the room |
| `player_moved` | `{ playerId, position, facing }` | Broadcast on every accepted move |
| `player_left` | `{ playerId }` | Broadcast on disconnect/leave |
| `error` | `{ code, message }` | e.g. `ROOM_FULL`, `NAME_TAKEN`, `INVALID_MOVE` |

## Movement Validation Rules
1. Destination tile must be within `[0, gridSize.width) × [0, gridSize.height)`.
2. Reject moves within the cooldown window (~150–200ms) of the player's last accepted move (server-side timestamp — never trust a client-sent time).
3. No terrain collision in MVP (every tile is walkable) and no player-vs-player collision (stacking allowed).

## Reconnect Handling
- Client holds its `playerId` + `roomId` for the session.
- On disconnect, server keeps the player's slot for a grace period (default 60s) before freeing it, so a page refresh doesn't kick the player from the world.
- **Status:** not yet implemented — see the TODO in `packages/server/src/index.ts`.

## Deployment Notes (MVP)
- A single Node process is sufficient — no horizontal scaling, message broker, or sticky sessions needed at this scale.
- No database required.
- Once this leaves localhost, run behind a reverse proxy with TLS (WSS) — browsers require secure WebSocket connections from HTTPS pages.
