# 002 — Server Join

## Status
Shipped (reconnect grace period pending — see [architecture/overview.md](../../architecture/overview.md#reconnect-handling))

## Summary
As a player, I want to join the available server so I can enter the shared world.

## Acceptance Criteria
- [x] A server list screen shows exactly one entry (name + live player count, e.g. "Forest Server — 3/50").
- [x] Clicking "Join" sends a `join_room` message with display name + chosen character.
- [x] On success, the client transitions to the Game View and receives a full state snapshot (grid dimensions, all connected players + positions).
- [x] On failure (server full, name taken, etc.) an inline error is shown and the player stays on the server list.
- [ ] On disconnect, the player's slot is held for a 60s grace window before being freed, so a page refresh resumes the same session instead of dropping the player.

## Out of Scope
- More than one server/room entry — the registry (`Map<serverId, Room>`) already supports it; see [ADR-0008](../../architecture/decisions/0008-multi-room-registry.md) and [`roadmap.md`](../../roadmap.md).
- Accounts/login — sessions stay anonymous, see [ADR-0007](../../architecture/decisions/0007-anonymous-sessions.md).

## Related
- Architecture: [Server Architecture](../../architecture/overview.md#server-architecture), [WebSocket Protocol](../../architecture/overview.md#websocket-protocol) (`join_room`, `join_ack`, `error`), [Reconnect Handling](../../architecture/overview.md#reconnect-handling)
- ADRs: [0007 — Anonymous Sessions](../../architecture/decisions/0007-anonymous-sessions.md), [0008 — Multi-Room Registry](../../architecture/decisions/0008-multi-room-registry.md)
- Flow: Character Select ([001](../001-character-select/spec.md)) → **Server Join** → Game View ([003](../003-movement/spec.md))
