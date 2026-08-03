# 003 — Movement

## Status
Shipped

## Summary
As a player, I want to move my character around the grid using the keyboard so I can explore the forest.

## Acceptance Criteria
- [x] Arrow keys / WASD move the player one tile at a time in the corresponding direction.
- [x] Movement is server-authoritative: the client sends an intent (`move: "up"`), and the sprite doesn't move on screen until the server confirms.
- [x] Server enforces a cooldown (~150–200ms) between accepted moves to prevent key-holding from teleporting across the map.
- [x] Attempting to move off the grid edge is rejected; the sprite still updates its facing direction.

## Out of Scope
- Terrain collision (every tile is walkable in MVP) — see [`roadmap.md`](../../roadmap.md) for terrain variety.
- Player-vs-player collision — stacking is allowed by design, not a bug.

## Related
- Architecture: [Movement Validation Rules](../../architecture/overview.md#movement-validation-rules), [WebSocket Protocol](../../architecture/overview.md#websocket-protocol) (`move`, `player_moved`)
- ADRs: [0004 — Event-Driven Update Model](../../architecture/decisions/0004-event-driven-update-model.md), [0005 — Server-Authoritative Movement](../../architecture/decisions/0005-server-authoritative-movement.md)
- Flow: Server Join ([002](../002-server-join/spec.md)) → Game View → **Movement** + [Multiplayer Presence](../004-multiplayer-presence/spec.md)
