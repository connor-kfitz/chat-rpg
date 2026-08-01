# fantasy-grid

Monorepo for the FF1-style multiplayer grid game. See `specs/` for the full spec set.

## Structure
- `packages/shared` — protocol types shared by client and server (no build step; consumed as TS source)
- `packages/server` — Node + `ws` WebSocket server, room registry, movement validation
- `packages/client` — Phaser 4 + Vite frontend

## Getting started
```
npm install          # installs all three workspaces from the root
npm run dev:server   # starts the WebSocket server on :8080
npm run dev:client   # starts the Vite dev server on :5173 (in another terminal)
npm run dev          # or run both together via `concurrently`
npm run typecheck    # type-checks all packages
npm run build:client # production build of the client
```

Open http://localhost:5173 — you'll land on Character Select, choose Mage or
Knight and a display name, see the Forest Server's live player count on the
Server List screen, then move around the shared grid with arrow keys/WASD
once you join.

## Status
- [x] Workspace scaffold, shared types, `tsc --noEmit` passing on all 3 packages
- [x] Server: room registry, `join_room`/`move`/`leave_room`/`list_rooms` handled, bounds + cooldown validated
- [x] Frontend: CharacterSelectScene, ServerListScene, GameScene + input/camera
- [ ] Backend: reconnect grace period (see TODO in `packages/server/src/index.ts`)
