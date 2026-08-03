# 0007 — Anonymous Sessions, No Accounts

## Status
Accepted

## Context
Players need an identity within a session (a display name, a `playerId`), but building accounts means auth (OAuth or email/password) and a database for profiles — a significant lift not needed to validate the core multiplayer-movement loop.

## Decision
No login system. Sessions are anonymous: a player supplies a display name at character-select time, and the server generates a `playerId` for the session. Nothing is tied to identity across sessions.

## Consequences
- Zero auth infrastructure needed for MVP.
- No way to prevent display-name collisions across truly distinct people beyond simple same-room name-taken checks.
- No persistence of a player's progress/position across sessions beyond the reconnect grace window (see [architecture/overview.md](../overview.md#reconnect-handling)).
- Superseded when accounts are added — see [roadmap.md](../../roadmap.md).
