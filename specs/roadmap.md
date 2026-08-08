# Roadmap

Backlog of things known to be coming but not yet built. Nothing here is scheduled — when an entry gets picked up, promote it into [`features/`](features/) (copy [`features/_template/spec.md`](features/_template/spec.md)) and remove it from this list.

## Chat
Not part of MVP by design — see [product/overview.md](product/overview.md#explicit-non-goals-for-mvp).
- Add a `chat_message` client→server event and a corresponding room-scoped broadcast. Since `Room` already exists as an abstraction, this is additive.
- Decide later: room-wide chat vs. proximity chat vs. whispers.

## More Characters/Classes
- `CharacterClass` is already a typed field ([architecture/overview.md](architecture/overview.md#data-model)) — extending the union and layering in stats/abilities is additive, not structural.

## Multiple Servers
- The `Map<serverId, Room>` registry already supports this (see [ADR-0008](architecture/decisions/0008-multi-room-registry.md)) — the server list screen just needs to render more than one entry.

## Combat / NPCs / Quests
- Bigger lift: likely needs a real fixed-tick game loop (supersedes [ADR-0004](architecture/decisions/0004-event-driven-update-model.md)), an entity system for NPCs, and combat resolution logic. Worth its own dedicated feature spec when picked up.

## Accounts & Persistence
- Anonymous sessions are fine short-term (see [ADR-0007](architecture/decisions/0007-anonymous-sessions.md)). Adding accounts means auth (OAuth or email/password), a database for player profiles (supersedes [ADR-0006](architecture/decisions/0006-in-memory-state.md)), and reconciling "current position" with "saved position" on login.

## Mobile/Touch Input
- Fast-follow, not MVP-blocking — desktop keyboard first. See [003 — Movement](features/003-movement/spec.md).
