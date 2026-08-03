# 0008 — Room Registry Designed for Multiple Rooms From Day One

## Status
Accepted

## Context
MVP only ever needs one server ("Forest Server"). It's cheap to decide up front whether the data structure holding rooms assumes exactly one, or is built as a registry that happens to have one entry.

## Decision
Model rooms as `Map<serverId, Room>` from the start, and register a single `"forest-1"` room at launch. The server-list screen and join flow are written against "N rooms," not "the one room."

## Consequences
- Adding more rooms later (per [roadmap.md](../../roadmap.md)) is additive — register more entries, render more rows on the server list — not a structural rewrite.
- Slightly more indirection than a single hardcoded `Room` object would need, for a benefit that only pays off once a second room actually exists.
