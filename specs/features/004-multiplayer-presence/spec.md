# 004 — Multiplayer Presence

## Status
Shipped

## Summary
As a player, I want to see other connected players moving in real time so the world feels shared.

## Acceptance Criteria
- [x] New player joins → all other clients get `player_joined` and render a sprite at the correct position, using that player's chosen character class for the sprite.
- [x] Player moves → all other clients get `player_moved` and animate the sprite to the new tile.
- [x] Player disconnects → all clients get `player_left` and the sprite is removed.

## Out of Scope
- Chat or any messaging between players — see [`roadmap.md`](../../roadmap.md).
- Combat, damage, or any player-to-player interaction.

## Related
- Architecture: [WebSocket Protocol](../../architecture/overview.md#websocket-protocol) (`player_joined`, `player_moved`, `player_left`)
- Depends on: [001 — Character Selection](../001-character-select/spec.md) (sprite per class), [003 — Movement](../003-movement/spec.md) (source of `player_moved` events)
