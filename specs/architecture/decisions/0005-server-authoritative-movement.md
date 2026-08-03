# 0005 — Server-Authoritative Movement

## Status
Accepted

## Context
Movement could be either client-authoritative (client moves the sprite immediately and tells the server where it ended up) or server-authoritative (client sends intent, server decides the outcome). Client authority is more responsive but trusts the client's reported position, opening the door to speed-hacking/teleporting and client/server desync.

## Decision
Clients send *intents* only (`move: "up"`), never positions. The server validates (bounds check, cooldown) and broadcasts the *result*. The local sprite does not move on screen until the server confirms.

## Consequences
- Server is the single source of truth for position; no client-reported state is trusted.
- Adds a round-trip of input latency before the local sprite moves — acceptable for grid-locked movement at this scale, would need reconciliation/prediction if movement becomes more real-time.
- Cheating via a modified client is limited to sending intents faster than allowed, which the cooldown check rejects server-side.
