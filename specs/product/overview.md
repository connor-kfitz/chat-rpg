# Product Overview

## Vision
A browser-based multiplayer game inspired by Final Fantasy 1's overworld aesthetic. Players choose a class, join a shared world, and move around a tile-based forest map alongside other connected players in real time. This is the foundation for a later social/chat layer.

## MVP Goals
1. Player picks one of two characters: Mage or Knight.
2. Player joins the (single) available server.
3. Player sees an N×N forest grid and moves their character with the keyboard.
4. Player sees other connected players moving in real time.
5. Game state (who's connected, where everyone is) lives authoritatively on the server, synced over WebSockets.

MVP goals are broken out into individual specs under [`features/`](../features/) (001–004). Anything not listed there is out of scope for now — see [`roadmap.md`](../roadmap.md).

## Explicit Non-Goals for MVP
- No chat (planned immediately post-MVP — see [`roadmap.md`](../roadmap.md)).
- No combat, no enemies/NPCs, no stats/abilities beyond the two class choices.
- No terrain variety — every tile in the grid is the same "forest" tile.
- No player accounts/login — sessions are anonymous.
- No persistence across server restarts — state is in-memory only.
- No multiple servers/rooms — only one hardcoded server exists (architecture supports more later).

## Constraints

### Art & IP
"Similar to Final Fantasy 1" is a style reference, not a license to use Square Enix's actual sprites/tiles. Plan on original or properly licensed pixel art in a similar aesthetic (e.g. a royalty-free asset pack, or commissioned art) — this affects timeline, so decide direction early. See [ADR-0009](../architecture/decisions/0009-original-art-direction.md).

## How this spec set works
- **`product/`** (this file) — the *why*. Changes rarely; update when the vision or MVP scope itself changes.
- **`architecture/overview.md`** — the *how*, as currently built. Kept in sync with reality as the system evolves.
- **`architecture/decisions/`** — one ADR per meaningful tradeoff. Immutable once accepted; superseded by a new ADR, never edited in place.
- **`features/`** — one spec per user-facing feature, in user-story format. Copy [`features/_template/spec.md`](../features/_template/spec.md) to start a new one.
- **`roadmap.md`** — backlog of things known to be coming. Promote an entry into `features/` when it's actually picked up.
