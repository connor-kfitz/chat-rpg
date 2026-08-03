# 0006 — In-Memory State Storage

## Status
Accepted

## Context
Game state (rooms, players, positions) needs to live somewhere. There is no MVP requirement for state to survive a server restart, and no accounts/persistence layer exists yet.

## Decision
Store all state in-memory (`Map` per process, scoped to each `Room`). No database.

## Consequences
- Simplest possible implementation — no schema, no queries, no persistence-layer bugs.
- All state is lost on server restart or crash; players are disconnected and must rejoin.
- Does not survive horizontal scaling (multiple server processes would each have their own disjoint state) — fine at current scale (single process), revisit if load requires scaling out.
- Superseded when accounts/persistence are added — see [roadmap.md](../../roadmap.md).
