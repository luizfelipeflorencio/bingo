# Pitfalls Research

**Domain:** Real-time Node.js WebSocket game-board (Bingo Live)
**Researched:** 2026-05-10
**Confidence:** HIGH

---

## Critical Pitfalls

### Pitfall 1: No State Snapshot on New Client Connect

**What goes wrong:**
A participant joins mid-game and sees a blank board. The server only broadcasts *events* (new number drawn), but never replays the current game state on initial connection. Early joiners see 40 numbers; a late joiner sees zero — even though the game is well underway.

**Why it happens:**
WebSocket event-driven thinking leads developers to wire up `ws.send(newNumber)` on each draw and forget the "catch-up" path. Localhost testing always starts fresh so it's never noticed until a real venue where people trickle in.

**How to avoid:**
On every new WebSocket `connection` event, immediately send the full current state — `{ type: "SYNC", drawnNumbers: [...], lastDrawn: N }` — before the client does anything else. This is the *handshake* contract; treat it as mandatory, not optional.

```js
wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'SYNC', state: gameState }));
  // then register for future broadcasts
});
```

**Warning signs:**
- Testing only by opening the page at game start and never mid-game
- No `SYNC` or `state` message type in the protocol spec
- LocalStorage as the *only* catch-up mechanism (it's empty for first-time visitors)

**Phase to address:** Phase 1 (WebSocket server foundation) — bake SYNC into the connection handler from day one.

---

### Pitfall 2: LocalStorage as Authoritative State (Stale State After Server Restart)

**What goes wrong:**
Server restarts (deploy, crash, idle timeout on free tiers like Railway's $0 plan). Client LocalStorage still shows 30 drawn numbers from the previous round. On reconnect, the server sends a fresh empty SYNC, but the client silently ignores it and keeps displaying the stale local state — now permanently desynced.

**Why it happens:**
LocalStorage is coded for the *refresh* use case (good) but then accidentally becomes authoritative over the server's SYNC (bad). The client logic reads: "if localStorage has data, prefer it" — which works across refreshes but breaks across server restarts.

**How to avoid:**
Server state is **always** authoritative. On receiving a SYNC message, the client **always** overwrites LocalStorage unconditionally — no merge, no preference. LocalStorage is a *cache of the last known server state*, used only when the WebSocket is temporarily disconnected during a page refresh.

**Warning signs:**
- `if (localStorage.drawnNumbers) { use local } else { use server }` logic
- No `lastSync` or `sessionId` version check in client code
- Participants reporting "stale numbers" after the host resets or redeploys

**Phase to address:** Phase 1 (client state management) — define the authority hierarchy in comments before writing a line of LocalStorage code.

---

### Pitfall 3: Reverse Proxy Drops WebSocket Upgrades (Railway/Render/Fly.io)

**What goes wrong:**
HTTP requests work fine. WebSocket connections silently fail with `101 Switching Protocols` never completing, or immediately drop with 502/504. The browser console shows `WebSocket connection to 'wss://...' failed`.

**Why it happens:**
Reverse proxies (nginx inside Railway/Render/Fly.io) need explicit configuration to:
1. Forward the `Upgrade: websocket` header
2. Set `Connection: Upgrade`
3. Disable response buffering (`proxy_buffering off`)
4. Not apply a short timeout to "idle" WebSocket connections

Most platform-as-a-service setups handle this automatically *if* the WebSocket is on the same port as HTTP — but the moment you use a separate WebSocket port or non-standard path, it breaks silently.

**How to avoid:**
- Use a **single port** for both HTTP and WebSocket (standard `ws://` upgrade on `/ws` path or root)
- On Railway: rely on their native WebSocket passthrough — no extra config needed when port matches `$PORT`
- On Render: set `Connection: keep-alive` and verify WS in the dashboard's "logs" tab on first deploy
- On Fly.io: expose only one port in `fly.toml`; Fly handles WS upgrades on the same port automatically
- Test WebSocket connectivity as a *deploy smoke test*, not as an afterthought

**Warning signs:**
- WS URL is on a different port than the HTTP server
- `wss://` URL hardcoded to a non-`$PORT` value
- Works locally (`ws://localhost:3000`) but 502 on production

**Phase to address:** Phase 1 (deployment scaffold) — deploy a minimal WS echo server before writing any game logic. Validate the upgrade path first.

---

### Pitfall 4: Client Reconnection Not Implemented (Silent Disconnect)

**What goes wrong:**
A participant's phone locks, the venue WiFi hiccups, or the server's free-tier instance goes to sleep for 30 seconds. WebSocket closes. The participant's screen freezes on whatever was last shown — no error, no spinner. They miss the next 5 drawn numbers and don't know it. When the next number *is* drawn, they stay frozen because there's no open socket to receive it.

**Why it happens:**
WebSocket reconnection is not built into the browser API. `new WebSocket(url)` gives you one connection; when it drops, it drops. Developers test on a stable localhost loop and never simulate a network interruption.

**How to avoid:**
Implement exponential-backoff reconnection from the very first version of the client:
```js
function connect() {
  const ws = new WebSocket(WS_URL);
  ws.onclose = () => setTimeout(connect, Math.min(1000 * 2 ** attempt++, 30000));
  ws.onopen  = () => { attempt = 0; /* server will SYNC */ };
  ws.onmessage = handleMessage;
}
```
On reconnect, the server's SYNC message automatically re-hydrates the client — see Pitfall 1. Show a "Reconnecting…" indicator so participants know the system is working on it.

**Warning signs:**
- `ws.onclose` handler is empty or just logs
- No visible reconnect indicator in the UI design
- Client tested only with a stable connection

**Phase to address:** Phase 1 (WebSocket client) — reconnect logic is not optional polish; it is core infrastructure for a venue environment where phones move between networks.

---

### Pitfall 5: Host URL "Security" Is Trivially Bypassed

**What goes wrong:**
A participant browses to `/host`, registers a fake number, and disrupts the game. Or they share the host URL (it's just a URL — it can be screenshotted, forwarded). The security model relies entirely on URL secrecy.

**Why it happens:**
The decision is intentional (no accounts for simplicity), but teams underestimate two failure modes:
1. The URL is visible in browser history / URL bar when the host uses a shared screen
2. The server has no enforcement — it only sends a different HTML page, but the WebSocket protocol (or REST API) is unguarded

**How to avoid:**
- Server **must** validate the host token on every state-mutating action (draw number, reset), not just serve different HTML. A WebSocket message `{ type: "DRAW", number: 42 }` from any client must be rejected unless it comes from a connection that authenticated with the host token.
- Include the host token in the WS handshake (query param or first message), not just in the URL of the page
- Make the host URL long and unguessable (e.g. `/host/a7f3k9p2`) — not just `/host`
- Document clearly: *this is not cryptographic security; it is suitable for a casual in-person game only*

**Warning signs:**
- Host enforcement is only at the HTML routing level (`if path === '/host'`)
- WebSocket message handler doesn't check client role/token
- Host URL is a predictable path like `/host` or `/admin`

**Phase to address:** Phase 1 (WebSocket server) + Phase 2 (security hardening) — server-side token check must be in the WS handler before the first deploy.

---

### Pitfall 6: No Handling of Duplicate or Out-of-Range Numbers

**What goes wrong:**
The host accidentally submits number 42 twice (double-tap, network retry, page refresh with form resubmit). The server appends 42 again to `drawnNumbers`. All clients now show 42 twice. Or the host submits 0, 91, or a non-integer — the server crashes or stores invalid state.

**Why it happens:**
Happy-path development. The input is validated client-side for UI feedback, but the server trusts the client entirely. Under real venue pressure (host moving fast, distracted), duplicates happen constantly.

**How to avoid:**
Server-side validation before mutating state:
```js
if (!Number.isInteger(n) || n < 1 || n > 90) return sendError(ws, 'INVALID_NUMBER');
if (gameState.drawnNumbers.includes(n)) return sendError(ws, 'ALREADY_DRAWN');
```
Return an error message back to the host client so the UI can display feedback. Never mutate state on invalid input.

**Warning signs:**
- Validation only in the frontend form
- No idempotency check in the server's draw-number handler
- `drawnNumbers` array has no deduplication at read time

**Phase to address:** Phase 1 (server state logic) — write the validation and the test for duplicate submission before wiring up the UI.

---

### Pitfall 7: Memory Leak from Dead WebSocket Connections

**What goes wrong:**
After hours of a Bingo session, with participants connecting and disconnecting on mobile (venue WiFi, phone sleep), the server's `clients` Set or array grows unboundedly. Dead connections are never removed. Eventually, broadcasting to 200 stale sockets on every number draw causes noticeable lag and memory pressure. On free-tier hosting with 512 MB RAM, this can OOM-crash the server.

**Why it happens:**
The `ws` library's `wss.clients` auto-manages its own set, but if you maintain *any* additional data structure (e.g., a `Set<WebSocket>`, a `Map<ws, playerData>`) you must clean it up on `close` and `error` events — and developers forget the `error` event.

**How to avoid:**
- Prefer `wss.clients` (the library-managed set) for broadcasting — don't maintain a parallel clients set
- If you need extra metadata: `ws.on('close', () => myMap.delete(ws))` **and** `ws.on('error', () => myMap.delete(ws))`
- Implement a periodic heartbeat (ping/pong) to detect truly dead connections that haven't fired `close`:
  ```js
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
  });
  setInterval(() => {
    wss.clients.forEach(ws => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);
  ```

**Warning signs:**
- No `ws.on('error', ...)` handler (unhandled errors also crash Node)
- Custom `clients` array that is only added to, never cleaned
- No heartbeat / ping-pong in the server code

**Phase to address:** Phase 1 (WebSocket server scaffold) — heartbeat is not optional for long-running sessions.

---

### Pitfall 8: Forgetting That Free-Tier Servers Sleep / Restart

**What goes wrong:**
Railway, Render (free tier), or Fly.io apps that see no traffic spin down after 5–15 minutes. The next HTTP request wakes them up — but all in-memory game state is gone. The Bingo game is mid-session; the server returns a fresh empty state; every client's LocalStorage is stale (Pitfall 2 in the wild).

**Why it happens:**
Development happens on a always-on local machine. The team deploys to a free tier for the venue, doesn't notice the sleep behavior, and discovers it live when the game state vanishes.

**How to avoid:**
- **Document** in the project that free-tier sleep = game state loss, and plan accordingly
- Use Railway's paid plan (no sleep) or Fly.io's always-on config for production venue use
- Alternatively: implement a `/health` keep-alive ping from a cron or UptimeRobot to prevent sleep — but this is a workaround, not a fix
- The SYNC mechanism (Pitfall 1) means clients *recover* their view from the server, but they recover to an *empty* state — which is actually correct behavior (new "game"), even if confusing mid-session

**Warning signs:**
- Deployed on Render free tier for a live venue event
- No mention of "state is lost on restart" in the host's UI or instructions
- No health check endpoint

**Phase to address:** Phase 2 (deployment) — decide on the hosting tier before the first real venue use.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Broadcast to `wss.clients` without filtering | Simple one-liner | Can't support multiple rooms later; all clients get all events | MVP with single room only |
| `JSON.parse` / `JSON.stringify` without try/catch | Less code | Malformed client message crashes the server | Never — add try/catch from day one |
| Storing `drawnNumbers` as a flat array (not Set) | Simple | O(n) duplicate check; fine at 90 numbers max | Acceptable for 90-ball Bingo specifically |
| Hardcoded WS URL in client JS | No env config needed | Breaks when domain changes; works locally but not in prod | Development only — use env var or relative URL from day one |
| No reconnection UI indicator | Faster to build | Users think the app is frozen; call game organizer | Never — 1 line of CSS is not worth the confusion |
| No host token validation on WS messages | Simpler server logic | Any client can call host actions | Never — this is the entire security model |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Railway / Render WebSocket | Opening WS on a port other than `$PORT` | Bind Express + ws to the same `$PORT`; platform routes all traffic there |
| `ws` library + Express | Creating two separate `http.createServer()` calls | Share one `http.Server` instance: `const server = http.createServer(app); new WebSocketServer({ server })` |
| HTTPS + WebSocket | Using `ws://` in production (mixed content blocked by browsers) | Always use `wss://` in production; derive from `window.location.protocol` client-side: `const proto = location.protocol === 'https:' ? 'wss' : 'ws'` |
| LocalStorage + WebSocket SYNC | Hydrating from localStorage before WS connects, then overwriting on SYNC | Initialize UI from localStorage immediately (good for UX), then overwrite when SYNC arrives — not "prefer one over the other" |
| Fly.io + WebSocket | Defining multiple `[[services.ports]]` entries | One port entry; WS upgrade is automatic on the same port |
| Express static + WebSocket path | WebSocket path `/ws` intercepted by Express static middleware | Mount WebSocket server *before* Express catches it, or use a non-`/` path that Express won't match |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Serializing full state on every broadcast | Slight lag grows with state size | Pre-serialize the full state object once per event, send the string to all clients | Negligible at 90 numbers, but good habit |
| Synchronous `JSON.parse` of client messages in hot path | Imperceptible at 1–5 messages/sec | No change needed for this scale — not a real concern at 1–2 events per game turn | Not relevant until thousands of events/sec |
| Broadcasting in a tight `forEach` loop with no error handling | One bad socket's send error kills the loop, stops delivery to all others | Wrap each `ws.send()` in try/catch; dead sockets throw | At 100 clients, one dead socket without error handling silently drops all subsequent broadcasts |
| Loading all 90 numbers as DOM elements on first paint | Page load jitter | Render the grid once; update cell state with CSS class toggles, not re-render | Not a real concern at 90 elements |
| No debounce on host's submit button | Host double-taps → duplicate number submitted → server must deduplicate | Disable submit button for 500ms after click; server deduplicates anyway | Every real venue with a rushed host |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Host enforcement only at HTTP routing level | Any client can send `{ type: "DRAW" }` over WS and draw numbers | Validate host token on every mutating WS message server-side |
| Guessable host URL (`/host`, `/admin`, `/host123`) | Participant stumbles on it or guesses it | Generate a long random slug (16+ chars) at startup; log it to console for the operator |
| Host token in URL query string logged by proxy | Proxy access logs expose the token | Acceptable risk for this use case, but document it; alternatively pass token in first WS message |
| No rate limiting on draw-number endpoint | Script kiddie floods server with 90 numbers in 1 second | Server-side: reject draws faster than 1 per 500ms; or simply: the in-memory set caps at 90 naturally |
| Serving host page at a predictable URL | Screen share / shoulder surfing exposes the URL | Make the path unguessable; show a warning "don't share your screen" in the host UI |
| Trusting client-sent `number` without type coercion | `{ number: "__proto__" }` or `{ number: null }` causes subtle state corruption | Always `parseInt(msg.number, 10)` and validate range before use |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual feedback when WebSocket is disconnected | Participant thinks the screen is correct; misses numbers | Show a persistent "Reconnecting…" banner when WS is closed; remove it when reconnected |
| Last-drawn number not visually distinguished from history | In a noisy venue, participants can't quickly find the new number | Make the most-recent number 3–4× larger; flash/animate it briefly on arrival |
| Tiny hit targets on host number input (mobile) | Host misdials in a busy venue | Large number buttons (not text input) for host on mobile — numbered grid or +/- stepper |
| No confirmation before reset | Host accidentally taps Reset mid-game | Two-step reset: "Reset?" → confirm button appears; auto-dismiss after 5 seconds |
| Numbers displayed in draw order only | Hard to visually scan if a number was called | Show draw-order history AND a sorted grid; drawn numbers highlighted in the grid |
| Page shows blank state while WS is connecting | First-time visitors see empty screen for 1–2 seconds | Show localStorage state immediately on load (even if unconfirmed); replace on SYNC |

---

## "Looks Done But Isn't" Checklist

- [ ] **WebSocket SYNC:** New client connecting mid-game gets the full current state — verify by opening a second browser tab after drawing 5 numbers
- [ ] **Reconnection:** Kill the server, restart it, verify the client reconnects and re-syncs without a page reload
- [ ] **LocalStorage override:** Draw 5 numbers, open DevTools → Application → LocalStorage and verify it matches server state; then restart server and verify client correctly resets to empty
- [ ] **Duplicate rejection:** Submit the same number twice from the host — verify server returns an error and the number appears only once in the list
- [ ] **Reset propagation:** Click Reset on host — verify ALL connected participant tabs clear within 1 second
- [ ] **Out-of-range rejection:** Submit 0 and 91 from host — verify server rejects both with an error, state unchanged
- [ ] **HTTPS + WSS:** Deployed to production URL — verify browser console has no mixed-content warnings and WS connects on `wss://`
- [ ] **Dead socket cleanup:** Connect 3 clients, close one abruptly (network tab → offline in DevTools), wait 60 seconds — verify server's client count decrements
- [ ] **Host token enforcement:** Open a raw WS connection (e.g. `wscat`) to the server without the host token; attempt to send a DRAW message — verify it's rejected
- [ ] **Mobile responsiveness:** Open the participant view on a phone in landscape orientation — verify the number grid is legible without horizontal scroll

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| New client gets blank board (no SYNC) | LOW | Add SYNC on connection; re-deploy; clients auto-reconnect and re-sync |
| Stale LocalStorage after server restart | LOW | Server SYNC always overwrites local state — just ensure client respects it |
| Reverse proxy dropping WS upgrades | MEDIUM | Test on staging first; fix proxy headers or consolidate to single port; re-deploy |
| Client not reconnecting | MEDIUM | Add reconnect logic; the SYNC on reconnect auto-repairs client state |
| Host token bypass (anyone can draw) | HIGH | Requires adding server-side token validation — touches WS handler, client handshake; full re-test |
| Duplicate numbers in state | LOW | Add dedup check in draw handler; for already-corrupted state, host resets the round |
| Memory leak / dead connections | MEDIUM | Add ping/pong heartbeat; also clean up `error` event — requires server restart to clear existing leak |
| Free-tier sleep kills game state | MEDIUM | Upgrade hosting tier, or add UptimeRobot keep-alive ping; document for operators |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| No state SYNC on connect | Phase 1 — WS server foundation | Open second tab mid-game; board matches first tab |
| LocalStorage as authority over server | Phase 1 — client state management | Restart server; client board clears to match empty server state |
| Reverse proxy WS upgrade failure | Phase 1 — deployment scaffold (deploy echo server first) | `wss://` connection established in browser console on first deploy |
| No client reconnection | Phase 1 — WS client infrastructure | Simulate server restart; client reconnects without page reload |
| Host URL enforcement only at routing level | Phase 1 — WS server + Phase 2 security hardening | wscat raw connection without token cannot draw numbers |
| Duplicate / invalid number submission | Phase 1 — server state logic | Submit same number twice; server rejects; list shows one entry |
| Dead connection memory leak | Phase 1 — WS server scaffold | Heartbeat present in code; `error` event cleans custom data structures |
| Free-tier server sleep | Phase 2 — deployment planning | Hosting tier documented; keep-alive strategy in place before live venue use |
| Missing mobile UX (host input, reconnect banner) | Phase 2 — UI polish | Manual test on physical phone in venue-like conditions |

---

## Sources

- `ws` library documentation — ping/pong heartbeat pattern (official README)
- Node.js WebSocket best practices — connection lifecycle (`open`, `close`, `error` events)
- Railway, Render, Fly.io platform docs — WebSocket support and port binding requirements
- MDN: WebSocket API — browser reconnection not built-in (confirmed: no auto-reconnect)
- OWASP: Insufficient Transport Layer Protection — WSS requirement on public internet
- Common post-mortems in real-time Node.js apps: Slack engineering blog (WebSocket at scale), Socket.io migration notes
- Known issue: `ws` library `close` event does not fire for all network drops — heartbeat is mandatory for reliable cleanup
- LocalStorage-as-cache vs. LocalStorage-as-authority — React/Redux community patterns on optimistic UI + server reconciliation

---
*Pitfalls research for: Real-time Node.js WebSocket Bingo system*
*Researched: 2026-05-10*
