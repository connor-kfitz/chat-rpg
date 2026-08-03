# 0004 — Event-Driven Update Model (Not Fixed-Tick)

## Status
Accepted

## Context
Grid movement with no physics doesn't need a simulation loop advancing state at a fixed rate. The alternative — a fixed-tick game loop that steps the world N times/sec — is the standard architecture for real-time games with physics, timers, or continuous combat.

## Decision
The server is event-driven: each valid `move` immediately updates state and broadcasts a delta. There is no tick loop.

## Consequences
- Simpler server: no scheduler, no per-tick state diffing.
- Lower latency for the common case — a move is broadcast as soon as it's validated, not on the next tick boundary.
- Does not extend cleanly to features needing simultaneous-resolution or time-based state (combat cooldowns beyond a simple per-player timestamp check, NPC AI, projectiles). Revisit when combat/NPCs are built — see [roadmap.md](../../roadmap.md).
