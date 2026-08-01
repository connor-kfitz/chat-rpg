# Chat Rpg MVP — Overview & Scope

## Vision
A browser-based multiplayer game inspired by Final Fantasy 1's overworld aesthetic. Players choose a class, join a shared world, and move around a tile-based forest map alongside other connected players in real time. This is the foundation for a later social/chat layer.

## MVP Goals
1. Player picks one of two characters: Mage or Knight.
2. Player joins the (single) available server.
3. Player sees an N×N forest grid and moves their character with the keyboard.
4. Player sees other connected players moving in real time.
5. Game state (who's connected, where everyone is) lives authoritatively on the server, synced over WebSockets.

## Explicit Non-Goals for MVP
- No chat (planned immediately post-MVP — see `03-post-mvp-roadmap.md`).
- No combat, no enemies/NPCs, no stats/abilities beyond the two class choices.
- No terrain variety — every tile in the grid is the same "forest" tile.
- No player accounts/login — sessions are anonymous.
- No persistence across server restarts — state is in-memory only.
- No multiple servers/rooms — only one hardcoded server exists (architecture supports more later).

## Gaps Identified & Default Decisions

These weren't specified in the original request. Each has a default baked into the specs — flag any you want changed.

### Gameplay
| Question | Default |
|---|---|
| Grid size (N) | 20×20, 32px tiles |
| Movement style | Grid-locked, one tile per keypress, ~150–200ms cooldown |
| Player-vs-player collision | None — players can share a tile |
| Camera | Scrolls, centered on local player, when grid > viewport |
| Sprite facing/direction | Yes — 4-directional |

### Identity & Sessions
| Question | Default |
|---|---|
| Login system | None — anonymous session, display name only |
| Reconnect behavior | Resume last position for a 60s grace window, then slot is freed |

### Server/World
| Question | Default |
|---|---|
| Should architecture assume more servers later? | Yes — `Map<serverId, Room>` registry from day one, one entry registered at launch |

### Technical
| Question | Default |
|---|---|
| Client rendering | Phaser 3 (Canvas/WebGL, built-in tilemaps + camera) |
| Backend | Node.js + TypeScript, `ws` library |
| State storage | In-memory only |
| Message format | JSON |
| Update model | Event-driven (move → validate → broadcast), not a fixed-tick loop |

### Art & IP
"Similar to Final Fantasy 1" is a style reference, not a license to use Square Enix's actual sprites/tiles. Plan on original or properly licensed pixel art in a similar aesthetic (e.g. a royalty-free asset pack, or commissioned art) — worth deciding direction now since it affects timeline.

### Left open for future extensibility (not built in MVP, but designed for)
- `characterClass` is a distinct typed field on the player, so stat/ability differentiation is a natural later addition even though it's purely cosmetic in MVP.
- Mobile/touch input is a fast-follow, not MVP-blocking — desktop keyboard first.
