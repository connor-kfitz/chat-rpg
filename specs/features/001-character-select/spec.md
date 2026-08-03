# 001 — Character Selection

## Status
Shipped

## Summary
As a player, I want to choose between Mage and Knight so I can pick how my character looks before entering the world.

## Acceptance Criteria
- [x] Two selectable options are shown, each with a name, portrait/sprite preview, and one-line flavor text.
- [x] Selecting a character highlights it; a "Confirm" button becomes active only after a selection is made.
- [x] The choice is held client-side for the session and sent to the server on join.
- [x] No stat/ability differences are surfaced — this is a visual/identity choice only.

## Out of Scope
- Stat/ability differentiation between classes — `characterClass` is a typed field designed to support this later without a structural change. See [`roadmap.md`](../../roadmap.md).
- Additional characters/classes beyond Mage and Knight — see [`roadmap.md`](../../roadmap.md).

## Related
- Architecture: [Client Architecture](../../architecture/overview.md#client-architecture), [Data Model](../../architecture/overview.md#data-model) (`CharacterClass`)
- Flow: Landing → **Character Select** → Server List ([002](../002-server-join/spec.md)) → Game View ([003](../003-movement/spec.md))
