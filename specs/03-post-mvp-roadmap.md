# Post-MVP Roadmap

Not part of the MVP build — noted here so the MVP is designed to absorb these without a rewrite.

## Chat
- Add a `chat_message` client→server event and a corresponding room-scoped broadcast. Since `Room` already exists as an abstraction, this is additive.
- Decide later: room-wide chat vs. proximity chat vs. whispers.

## More Characters/Classes
- `CharacterClass` is already a typed field — extending the union and layering in stats/abilities is additive, not structural.

## Terrain Variety
- `tileType` is currently a single constant. Swapping to a 2D array of tile types (water, mountains, etc.) is a contained change to `GameState` and the client's tilemap renderer.

## Multiple Servers
- The `Map<serverId, Room>` registry already supports this — the server list screen just needs to render more than one entry.

## Combat / NPCs / Quests
- Bigger lift: likely needs a real fixed-tick game loop, an entity system for NPCs, and combat resolution logic. Worth its own dedicated spec when you get there.

## Accounts & Persistence
- Anonymous sessions are fine short-term. Adding accounts means auth (OAuth or email/password), a database for player profiles, and reconciling "current position" with "saved position" on login.
