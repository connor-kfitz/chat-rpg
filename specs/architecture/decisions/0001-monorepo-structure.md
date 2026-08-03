# 0001 — Monorepo Structure

## Status
Accepted

## Context
Client and server both consume the same protocol contracts (`Player`, `Room`, WebSocket message shapes). In separate repos, those types get hand-duplicated on each side and will drift. The project has a single deploy target, TypeScript on both ends, and no independent release cadences between client/server.

## Decision
Use a single repo with npm workspaces (built into npm 7+): `packages/client`, `packages/server`, `packages/shared`. `shared` is the source of truth for protocol types, imported by both other packages. No Nx/Turborepo/Lerna — three packages doesn't justify the extra tooling.

## Consequences
- A protocol change is a single PR that touches both sides atomically, and the type-checker catches drift immediately.
- No independent versioning/release per package — acceptable since there's one deploy target.
- Revisit if client and server ever need separate deploy pipelines or release cadences.
