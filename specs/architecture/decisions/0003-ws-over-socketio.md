# 0003 — `ws` Over `socket.io`

## Status
Accepted

## Context
The server needs a WebSocket transport for a small, fully custom message protocol (`join_room`, `move`, `leave_room`, etc.). `socket.io` offers reconnection, room abstractions, and fallback transports out of the box, at the cost of its own framing/handshake layer on top of raw WebSockets.

## Decision
Use the `ws` library: a thin WebSocket implementation with no built-in protocol opinions. The custom message protocol is defined entirely in `packages/shared`, and rooms/reconnection are implemented directly rather than adopted from a framework.

## Consequences
- Full control over the wire format (plain JSON, see [architecture/overview.md](../overview.md#websocket-protocol)) — easy to debug at this scale, no hidden framing.
- Native `WebSocket` API works directly on the client with no matching client library required.
- Reconnection/room semantics that `socket.io` would give for free (e.g. automatic client reconnect) must be built by hand — see reconnect handling in [architecture/overview.md](../overview.md#reconnect-handling).
