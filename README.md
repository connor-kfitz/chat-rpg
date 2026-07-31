# fantasy-grid

Monorepo for the FF1-style multiplayer grid game. See `specs/` for the full spec set.

## Structure
- `packages/shared` — protocol types shared by client and server (no build step; consumed as TS source)
- `packages/server` — Node + `ws` WebSocket server, room registry, movement validation
- `packages/client` — Phaser 3 + Vite frontend

## Getting started
```
npm install          # installs all three workspaces from the root
npm run dev:server   # starts the WebSocket server on :8080
npm run dev:client   # starts the Vite dev server on :5173 (in another terminal)
npm run dev          # or run both together via `concurrently`
npm run typecheck    # type-checks all packages
npm run build:client # production build of the client
```

Open http://localhost:5173 — you should see a tiled forest background, a mage
sprite, and "fantasy-grid scaffold OK". That confirms Vite, Phaser, and the
generated sprites are wired up correctly. This boot scene gets replaced by
the real `CharacterSelectScene` → `ServerListScene` → `GameScene` flow during
the frontend build phase.

## Status
- [x] Workspace scaffold, shared types, `tsc --noEmit` passing on all 3 packages
- [x] Server: room registry, `join_room`/`move`/`leave_room` handled, bounds + cooldown validated
- [x] Client: boot scene proves the asset pipeline works
- [ ] Frontend: CharacterSelectScene, ServerListScene, real GameScene + input/camera
- [ ] Backend: reconnect grace period (see TODO in `packages/server/src/index.ts`)
