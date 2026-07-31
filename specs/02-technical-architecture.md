# Technical Architecture — MVP

## Stack Recommendation

| Layer | Choice | Why |
|---|---|---|
| Client rendering | Phaser 3 (Canvas/WebGL) | Built-in tilemaps, sprite animation, camera-follow — everything needed for an FF1-style overworld, purely client-side |
| Client transport | Native WebSocket API | Matches a plain `ws` server; no extra client library needed |
| Server runtime | Node.js + TypeScript | Shared language client/server, mature WebSocket ecosystem |
| WebSocket library | `ws` | Lightweight, full control over the message protocol (vs. `socket.io`'s heavier abstraction, which isn't needed at this scale) |
| State storage | In-memory (`Map` per process) | No persistence requirement yet — simplest possible MVP |
| Message format | JSON | Human-readable, easy to debug at this scale |

## Repository Structure

**Decision: monorepo.** Client and server both consume the same protocol contracts (`Player`, `Room`, WebSocket message shapes — see Data Model and WebSocket Protocol below). In separate repos those types get hand-duplicated on each side and will drift; in a monorepo they're imported from one `shared` package, so a protocol change is a single PR that touches both sides atomically. At this project's scale (single deploy target, TypeScript on both ends, no independent release cadences) there's no offsetting benefit to splitting repos.

**Tooling**: npm workspaces (built into npm 7+) — no need for Nx/Turborepo/Lerna with only three packages.

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

- **Screens**: `CharacterSelectScene` → `ServerListScene` → `GameScene` (Phaser scenes).
- **GameScene** owns:
  - A tilemap render of the N×N forest grid.
  - A sprite per connected player, keyed by `playerId`.
  - Input handling (arrow keys/WASD) → sends `move` intents; does **not** move the local sprite until the server confirms (prevents client/server desync).
  - A WebSocket connection manager that dispatches incoming events into scene state.

## Server Architecture

- A single Node process hosts:
  - An HTTP server (serves static client assets) with a WebSocket upgrade path.
  - A room registry: `Map<serverId, Room>`. Only one `Room` ("forest-1") is registered at launch, but the abstraction supports more without a rewrite.
  - Each `Room` owns its own `GameState`: grid dimensions, tile type, and a `Map<playerId, Player>`.
- **Update model**: event-driven, not a fixed-tick simulation — a fixed tick loop isn't needed for grid movement with no physics. Each valid `move` immediately updates state and broadcasts a delta. Revisit if combat/timers are added later.
- **Authority model**: server is the single source of truth. Clients send *intents* (`move: "up"`), never positions. Server validates and broadcasts the *result*.

## Data Model

```ts
type CharacterClass = "mage" | "knight";
type Direction = "up" | "down" | "left" | "right";

interface Player {
  id: string;              // server-generated
  displayName: string;
  characterClass: CharacterClass;
  position: { x: number; y: number };
  facing: Direction;
  connectedAt: number;
}

interface Room {
  id: string;               // e.g. "forest-1"
  name: string;              // e.g. "Forest Server"
  gridSize: { width: number; height: number }; // default 20x20
  tileType: "forest";        // only value in MVP
  players: Map<string, Player>;
  maxPlayers: number;        // e.g. 50
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
2. Reject moves within the cooldown window of the player's last accepted move (server-side timestamp — never trust a client-sent time).
3. No terrain collision in MVP (every tile is walkable) and no player-vs-player collision (stacking allowed).

## Reconnect Handling
- Client holds its `playerId` + `roomId` for the session.
- On disconnect, server keeps the player's slot for a grace period (default 60s) before freeing it, so a page refresh doesn't kick the player from the world.

## Deployment Notes (MVP)
- A single Node process is sufficient — no horizontal scaling, message broker, or sticky sessions needed at this scale.
- No database required.
- Once this leaves localhost, run behind a reverse proxy with TLS (WSS) — browsers require secure WebSocket connections from HTTPS pages.
