# Architecture Research

**Domain:** Real-time multiplayer game board / Bingo (Node.js + WebSockets)
**Researched:** 2026-05-10
**Confidence:** HIGH

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PUBLIC INTERNET                               │
│                 (HTTPS / WSS via Reverse Proxy)                      │
├────────────────────────┬────────────────────────────────────────────┤
│      HOST CLIENT       │          PARTICIPANT CLIENTS (N)            │
│  ┌─────────────────┐   │   ┌────────────┐   ┌────────────┐          │
│  │  Host View      │   │   │ Player View│   │ Player View│  ...     │
│  │  (call numbers, │   │   │ (bingo card│   │ (bingo card│          │
│  │   see players)  │   │   │  marks)    │   │  marks)    │          │
│  └────────┬────────┘   │   └─────┬──────┘   └─────┬──────┘          │
│           │  WSS       │         │  WSS             │  WSS           │
└───────────┼────────────┴─────────┼─────────────────┼────────────────┘
            │                      │                  │
┌───────────▼──────────────────────▼──────────────────▼────────────────┐
│                        REVERSE PROXY (nginx / Caddy)                  │
│             TLS termination · HTTP→HTTPS redirect · WS upgrade        │
└───────────────────────────────────┬───────────────────────────────────┘
                                    │ HTTP + WS (plain, internal)
┌───────────────────────────────────▼───────────────────────────────────┐
│                        NODE.JS SERVER                                  │
│                                                                        │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      HTTP Layer (Express)                        │  │
│  │   GET /           → serves host.html                            │  │
│  │   GET /play/:code → serves participant.html                     │  │
│  │   GET /health     → health check                                │  │
│  └─────────────────────────────┬───────────────────────────────────┘  │
│                                │                                       │
│  ┌─────────────────────────────▼───────────────────────────────────┐  │
│  │                    WebSocket Gateway                             │  │
│  │   • Upgrades HTTP → WS connections                              │  │
│  │   • Authenticates role (host token vs. participant)             │  │
│  │   • Routes inbound messages → Game Event Handler               │  │
│  │   • Maintains connection registry (ws → {role, gameId, playerId})│  │
│  └─────────────────────────────┬───────────────────────────────────┘  │
│                                │                                       │
│  ┌─────────────────────────────▼───────────────────────────────────┐  │
│  │                    Game Event Handler                            │  │
│  │   • Validates message schema                                    │  │
│  │   • Applies action to Game State Store                          │  │
│  │   • Determines who gets notified (broadcast / unicast)         │  │
│  │   • Calls Broadcaster with resulting state delta               │  │
│  └──────────────┬──────────────────────────────────┬──────────────┘  │
│                 │                                  │                   │
│  ┌──────────────▼──────────────┐   ┌──────────────▼──────────────┐   │
│  │     Game State Store        │   │        Broadcaster           │   │
│  │  (in-memory Map)            │   │  • broadcast(gameId, msg)   │   │
│  │                             │   │  • unicast(ws, msg)         │   │
│  │  gameId → {                 │   │  • toRole(gameId, role, msg)│   │
│  │    status, calledNumbers,   │   └─────────────────────────────┘   │
│  │    currentNumber,           │                                       │
│  │    players: Map<id,player>  │                                       │
│  │  }                          │                                       │
│  └─────────────────────────────┘                                       │
└────────────────────────────────────────────────────────────────────────┘

CLIENT-SIDE (each browser tab)
┌──────────────────────────────────────────────┐
│  WS Client   ←→   App State (JS object)      │
│                       ↕                      │
│               LocalStorage (card layout,     │
│                marked cells, game code)      │
└──────────────────────────────────────────────┘
```

---

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Reverse Proxy** | TLS termination, WS upgrade headers, static asset caching | nginx or Caddy (single config file) |
| **HTTP Layer** | Serve HTML shells, health endpoint | Express (minimal — 3–4 routes) |
| **WebSocket Gateway** | Connection lifecycle, auth, message routing | `ws` library + `upgrade` event on HTTP server |
| **Game Event Handler** | Business logic: validate → mutate state → emit | Pure functions keyed on `message.type` |
| **Game State Store** | Single source of truth for all live games | `Map<gameId, GameState>` in process memory |
| **Broadcaster** | Fan-out messages to the right set of connections | Helper that iterates the WS connection registry |
| **Host Client** | Call numbers, start/end game, view player list | Vanilla JS or lightweight framework (single page) |
| **Participant Client** | Display card, mark cells, detect bingo | Vanilla JS; card state persisted to LocalStorage |

---

## Recommended Project Structure

```
bingo/
├── server/
│   ├── index.js            # Entry point — creates HTTP server, attaches WS
│   ├── http.js             # Express app, static routes, health check
│   ├── ws/
│   │   ├── gateway.js      # WS upgrade, connection registry, message router
│   │   ├── handlers.js     # Game event handlers (one export per message type)
│   │   └── broadcaster.js  # broadcast / unicast / toRole helpers
│   ├── game/
│   │   ├── store.js        # In-memory Map, CRUD helpers for GameState
│   │   ├── logic.js        # Pure: card generation, number draw, bingo check
│   │   └── types.js        # JSDoc typedefs for GameState, Player, Message
│   └── config.js           # PORT, HOST_SECRET, MAX_PLAYERS — from env
│
├── client/
│   ├── host/
│   │   ├── index.html
│   │   ├── host.js         # WS connect, render player list, call button
│   │   └── host.css
│   └── participant/
│       ├── index.html
│       ├── participant.js  # WS connect, render card, mark cells, LocalStorage
│       └── participant.css
│
├── .planning/
│   └── research/
│       └── ARCHITECTURE.md  ← this file
├── package.json
└── .env.example
```

### Structure Rationale

- **`server/ws/`** — Keeps WebSocket concerns isolated; gateway never knows game rules, handlers never know WS internals.
- **`server/game/`** — `logic.js` contains only pure functions (card gen, bingo check); they are testable without a running server.
- **`server/game/store.js`** — Single file owns the Map. Every mutation goes through its API, so adding persistence later (Redis, SQLite) is a one-file swap.
- **`client/host/` vs `client/participant/`** — Separate HTML entry points prevent role logic from bleeding between views and make nginx routing trivial.

---

## Architectural Patterns

### Pattern 1: Event-Sourced State via WebSocket Message Types

**What:** Each action is a typed message (`{ type, payload }`). The server applies it, updates state, then broadcasts a corresponding event. Clients never share state directly — everything flows through the server.

**When to use:** Always for multiplayer games. Keeps server as single source of truth; prevents clients from disagreeing on game state.

**Trade-offs:** Slightly more verbose protocol; all state changes are auditable.

**Example:**
```javascript
// Inbound (host → server)
{ type: "CALL_NUMBER", payload: { gameId: "ABC123" } }

// Outbound (server → all participants)
{ type: "NUMBER_CALLED", payload: { number: 42, calledNumbers: [7, 15, 42] } }
```

---

### Pattern 2: Connection Registry (Map of ws → metadata)

**What:** On WS connect, store the socket alongside its role, gameId, and playerId. Use this registry to target broadcasts correctly — never iterate all connections for a single game's event.

**When to use:** Any time multiple games or roles coexist on one server.

**Trade-offs:** Requires cleanup on `ws.on('close')` to avoid memory leaks.

**Example:**
```javascript
// gateway.js
const connections = new Map(); // ws → { role, gameId, playerId }

wss.on('connection', (ws, req) => {
  const meta = parseConnectionMeta(req); // role + gameId from query params
  connections.set(ws, meta);
  ws.on('close', () => connections.delete(ws));
  ws.on('message', (raw) => route(ws, raw, connections));
});
```

---

### Pattern 3: Thin Client with Server-Authoritative State

**What:** Clients send intent (`MARK_CELL`, `CLAIM_BINGO`), server validates and confirms. Client only renders what the server acknowledges. LocalStorage is used only for UI recovery (reconnecting to the same game/card), not as a state authority.

**When to use:** Any game where cheating or desync matters — which is every multiplayer game.

**Trade-offs:** Adds a round-trip before UI updates feel "confirmed"; mitigate with optimistic UI for low-stakes marking.

---

## Data Flow

### Primary Flow: Host Calls a Number

```
[Host clicks "Call Number"]
    ↓
Host JS → WS send: { type: "CALL_NUMBER", payload: { gameId } }
    ↓
WS Gateway receives → looks up meta → routes to handlers.callNumber()
    ↓
handlers.callNumber()
    → store.drawNumber(gameId)            // picks next random number, mutates state
    → broadcaster.broadcast(gameId, {     // fans out to ALL connections in game
          type: "NUMBER_CALLED",
          payload: { number: N, calledNumbers: [...] }
      })
    ↓
Each Participant Client receives "NUMBER_CALLED"
    → marks matching cells on card (DOM update)
    → saves marked cells to LocalStorage
    ↓
Host Client receives "NUMBER_CALLED"
    → adds N to called-numbers display
```

### Secondary Flow: Participant Claims Bingo

```
[Participant clicks "Bingo!"]
    ↓
Participant JS → WS send: { type: "CLAIM_BINGO", payload: { gameId, playerId, markedCells } }
    ↓
handlers.claimBingo()
    → logic.verifyBingo(markedCells, calledNumbers, card)  // pure validation
    → if VALID:
        store.setWinner(gameId, playerId)
        broadcaster.broadcast(gameId, { type: "BINGO_CONFIRMED", payload: { playerId } })
    → if INVALID:
        broadcaster.unicast(ws, { type: "BINGO_REJECTED", payload: { reason } })
    ↓
All clients receive "BINGO_CONFIRMED" → show winner banner
```

### Tertiary Flow: Participant Reconnect

```
[Browser tab reopens / refreshes]
    ↓
Participant JS reads LocalStorage: { gameCode, playerId, card, markedCells }
    ↓
WS connect with query params: ?gameId=ABC123&playerId=xyz
    ↓
handlers.rejoin()
    → store.getGame(gameId) — still live?
    → unicast back: { type: "GAME_STATE", payload: { calledNumbers, status, players } }
    ↓
Client reconciles: re-marks any cells that server confirms were called
    → updates LocalStorage with reconciled state
```

### Key Data Flows Summary

1. **Number registered → broadcast:** Host action → server mutates in-memory state → server broadcasts delta to all game connections → clients update DOM.
2. **Card generation:** On `JOIN`, server generates a unique 5×5 card (or sends a seed), stores it in `player.card`, unicasts it to the participant → participant saves card to LocalStorage.
3. **Bingo claim → validation → result:** Client sends claimed cells → server re-runs bingo check against server-side state → confirms or rejects → result broadcast.
4. **LocalStorage role:** Participant-only. Stores: `gameCode`, `playerId`, `card` layout, `markedCells[]`. Used only for reconnection — never as game authority.

---

## Suggested Build Order

Dependencies flow strictly from bottom to top. Do not build a layer until its dependency is solid.

```
Phase 1 — Core Skeleton (no game logic yet)
  [1] server/config.js + server/index.js     (HTTP server boots, port configurable)
  [2] server/http.js                         (serves static HTML, health route)
  [3] server/ws/gateway.js                   (WS upgrade, connection registry, close cleanup)

Phase 2 — Game State
  [4] server/game/types.js                   (shared typedefs — no deps)
  [5] server/game/logic.js                   (pure functions: card gen, draw, bingo check — testable standalone)
  [6] server/game/store.js                   (in-memory Map with CRUD — depends on types + logic)

Phase 3 — Event Handlers + Broadcaster
  [7] server/ws/broadcaster.js               (fan-out helpers — depends on gateway's connection Map)
  [8] server/ws/handlers.js                  (wires logic + store + broadcaster — all pieces now exist)

Phase 4 — Host Client
  [9] client/host/host.js + host.html        (WS connect, create game, call number, player list)

Phase 5 — Participant Client
  [10] client/participant/participant.js      (WS connect, join, render card, mark, LocalStorage, bingo claim)

Phase 6 — Hardening
  [11] Reconnection flow (rejoin handler + client reconciliation)
  [12] Reverse proxy config (nginx/Caddy, TLS, WS upgrade headers)
  [13] Error boundaries (malformed message handling, game-not-found, server restart UX)
```

**Key dependency rule:** `handlers.js` is the last server file built because it depends on everything — gateway (for broadcaster), store, and logic. Resist the urge to write it first.

---

## WebSocket Message Protocol Design

### Conventions

- All messages are JSON objects: `{ type: string, payload: object }`
- `type` uses `SCREAMING_SNAKE_CASE` — visually distinct from JS identifiers
- `payload` is always an object (never a primitive) — extensible without breaking parsers
- Server → Client messages include a top-level `timestamp` (Unix ms) for debugging
- Unknown `type` values are silently ignored by clients (forward compatibility)

### Message Catalogue

#### Client → Server (Inbound)

| Message Type | Sender | Payload | Description |
|---|---|---|---|
| `CREATE_GAME` | Host | `{ hostName }` | Host creates a new game room; server returns `gameId` + `hostToken` |
| `START_GAME` | Host | `{ gameId, hostToken }` | Transitions game from `lobby` → `active` |
| `CALL_NUMBER` | Host | `{ gameId, hostToken }` | Server picks next number and broadcasts it |
| `END_GAME` | Host | `{ gameId, hostToken }` | Ends game, triggers final broadcast |
| `JOIN_GAME` | Participant | `{ gameId, playerName }` | Joins lobby; server generates card, returns `playerId` |
| `REJOIN_GAME` | Participant | `{ gameId, playerId }` | Reconnect with existing identity |
| `CLAIM_BINGO` | Participant | `{ gameId, playerId, markedCells: number[] }` | Server validates claim |

#### Server → Client (Outbound)

| Message Type | Target | Payload | Description |
|---|---|---|---|
| `GAME_CREATED` | Host (unicast) | `{ gameId, joinUrl }` | Confirmation after `CREATE_GAME` |
| `PLAYER_JOINED` | Host + all participants | `{ playerId, playerName, playerCount }` | Someone joined the lobby |
| `GAME_STARTED` | All in game | `{ calledNumbers: [] }` | Game is now active |
| `NUMBER_CALLED` | All in game | `{ number, calledNumbers: number[] }` | New number was drawn |
| `BINGO_CONFIRMED` | All in game | `{ playerId, playerName }` | Valid bingo claim |
| `BINGO_REJECTED` | Claimant (unicast) | `{ reason }` | Invalid claim |
| `GAME_ENDED` | All in game | `{ winnerId, winnerName }` | Host ended game |
| `GAME_STATE` | Rejoining player (unicast) | `{ status, calledNumbers, card, players }` | Full state sync on reconnect |
| `ERROR` | Requestor (unicast) | `{ code, message }` | Protocol/validation error |

### State Machine

```
[lobby]
   │  START_GAME (host)
   ▼
[active]
   │  CLAIM_BINGO confirmed  OR  END_GAME (host)
   ▼
[finished]
```

Server rejects any action that doesn't match the current `status` (e.g., `CALL_NUMBER` while in `lobby`).

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|---|---|
| 0–100 concurrent WS | Current design — single Node.js process, in-memory Map. Fine for this target. |
| 100–1k concurrent WS | Node.js handles this easily; add `cluster` module if CPU-bound. No architecture changes needed. |
| 1k–10k concurrent WS | Extract game state to Redis (Pub/Sub for fan-out); multiple Node processes behind load balancer with sticky sessions or Redis adapter. |
| 10k+ | Dedicated WS gateway (e.g., Socket.io with Redis adapter, or a purpose-built service); state in Redis Cluster. |

### Scaling Priorities (for this project)

1. **First bottleneck:** Memory. Each active game stores a card per player (~200 bytes × 100 players = trivial). The real limit is dangling connections from players who never disconnect cleanly — add a heartbeat/ping-pong keepalive with a 30s timeout.
2. **Second bottleneck:** Fan-out loop. Broadcasting to 100 connections in a `for` loop is synchronous but fine at this scale. If you add 1000+ players per game, switch to async batched sends.

---

## Anti-Patterns

### Anti-Pattern 1: Trusting Client-Side Bingo Claims Without Verification

**What people do:** Client detects bingo locally and the server broadcasts the win without re-checking.

**Why it's wrong:** Any player can fabricate a `CLAIM_BINGO` message with fake `markedCells`. The server must re-run `verifyBingo(markedCells, calledNumbers, storedCard)` using only data the server controls.

**Do this instead:** Server holds the canonical card per player (stored in `player.card` at join time). Verification uses server state only; client's `markedCells` is just a hint.

---

### Anti-Pattern 2: Broadcasting Everything to Everyone

**What people do:** On any event, loop all open WebSocket connections and send the message.

**Why it's wrong:** With multiple simultaneous games, participants in game "ABC" receive events for game "XYZ". Also leaks game state across game boundaries.

**Do this instead:** The connection registry maps `ws → { gameId, ... }`. The broadcaster filters by `gameId` before iterating. Never iterate the global connection set for a game-scoped event.

---

### Anti-Pattern 3: Storing Game State on the Client

**What people do:** Use LocalStorage as the primary state store, syncing peers through the server.

**Why it's wrong:** Each client's LocalStorage diverges. Reconnecting players get stale state. Bingo verification becomes impossible without server authority.

**Do this instead:** LocalStorage is a reconnection cache only — `{ gameCode, playerId, card, markedCells }`. On reconnect, the server sends authoritative state and the client reconciles, overwriting LocalStorage with the canonical version.

---

### Anti-Pattern 4: Tight Coupling Between WS Gateway and Game Logic

**What people do:** Write bingo validation, number drawing, and win conditions directly inside the `connection` or `message` event callbacks.

**Why it's wrong:** The WS gateway becomes untestable; game rules are buried in I/O code; impossible to swap transports or add HTTP endpoints for the same logic.

**Do this instead:** Gateway calls handlers, handlers call pure logic functions and the store. The gateway knows nothing about Bingo; it only speaks connection management and routing.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Reverse Proxy (nginx/Caddy)** | Proxy pass + WS upgrade headers | Must pass `Upgrade`, `Connection`, `Host` headers; Caddy handles automatically |
| **TLS Certificate** | Let's Encrypt via Caddy ACME or certbot | Caddy auto-renews; nginx needs cron + reload |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Gateway ↔ Handlers | Direct function call (sync) | Handlers are simple functions, no event bus needed at this scale |
| Handlers ↔ Store | Direct function call (sync) | Store methods are synchronous Map operations |
| Handlers ↔ Broadcaster | Direct function call (sync) | Broadcaster iterates connections synchronously |
| Broadcaster ↔ Gateway | Shared `connections` Map reference | Broadcaster reads Map; only gateway writes to it |
| Client ↔ LocalStorage | Browser API (synchronous) | Only participant client; always written after server confirmation |

---

## Sources

- [MDN WebSockets API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [ws (npm) — Node.js WebSocket library documentation](https://github.com/websockets/ws)
- [OWASP WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#websockets)
- Real-time multiplayer architecture — standard event-sourced patterns (Colyseus framework design docs, boardgame.io architecture)
- [Nginx WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)
- [Caddy reverse proxy docs](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)

---
*Architecture research for: Real-time Bingo / game-board system (Node.js + WebSockets, in-memory, 20–100 concurrent connections)*
*Researched: 2026-05-10*
