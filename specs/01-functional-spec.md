# Functional Specification — MVP

## User Flow
1. Landing → Character Select
2. Character Select → choose Mage or Knight → Confirm
3. Server List (single entry) → Join
4. Game View → move around the forest grid, see other players

---

## US-1: Character Selection
As a player, I want to choose between Mage and Knight so I can pick how my character looks before entering the world.

**Acceptance criteria**
- Two selectable options are shown, each with a name, portrait/sprite preview, and one-line flavor text.
- Selecting a character highlights it; a "Confirm" button becomes active only after a selection is made.
- The choice is held client-side for the session and sent to the server on join.
- No stat/ability differences are surfaced in MVP — this is a visual/identity choice only.

---

## US-2: Server Join
As a player, I want to join the available server so I can enter the shared world.

**Acceptance criteria**
- A server list screen shows exactly one entry (name + live player count, e.g. "Forest Server — 3/50").
- Clicking "Join" sends a `join_room` message with display name + chosen character.
- On success, the client transitions to the Game View and receives a full state snapshot (grid dimensions, all connected players + positions).
- On failure (server full, name taken, etc.) an inline error is shown and the player stays on the server list.

---

## US-3: Movement
As a player, I want to move my character around the grid using the keyboard so I can explore the forest.

**Acceptance criteria**
- Arrow keys / WASD move the player one tile at a time in the corresponding direction.
- Movement is **server-authoritative**: the client sends an intent (`move: "up"`), and the sprite doesn't move on screen until the server confirms.
- Server enforces a cooldown (~150–200ms) between accepted moves to prevent key-holding from teleporting across the map.
- Attempting to move off the grid edge is rejected; the sprite still updates its facing direction.

---

## US-4: Seeing Other Players
As a player, I want to see other connected players moving in real time so the world feels shared.

**Acceptance criteria**
- New player joins → all other clients get `player_joined` and render a sprite at the correct position, using that player's chosen character class for the sprite.
- Player moves → all other clients get `player_moved` and animate the sprite to the new tile.
- Player disconnects → all clients get `player_left` and the sprite is removed.

---

## Explicitly Out of Scope for MVP
- Chat/messaging between players.
- Combat, damage, HP, or any player-to-player interaction.
- Inventory, items, quests.
- Persistent accounts or saved state between sessions.
