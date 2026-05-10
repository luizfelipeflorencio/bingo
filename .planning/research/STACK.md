# Stack Research — Bingo Live

**Date:** 2026-05-10
**Scope:** Node.js real-time Bingo management system; 20–100 concurrent WebSocket clients; public internet deployment
**Versions verified:** npm registry (live query, 2026-05-10)

---

## Decision Summary

| Layer | Choice | Version | Confidence |
|---|---|---|---|
| Runtime | Node.js LTS | 22.x (Jod) / 24.x (Krypton) | High |
| HTTP server | Express | 5.2.1 | High |
| WebSocket | Socket.io (server + client) | 4.8.3 | High |
| Frontend | Vanilla JS | — | High |
| Build tooling | None / Vite (optional) | 6.x | Medium |
| Config | dotenv | 17.4.2 | High |
| Dev runner | nodemon | 3.1.14 | High |
| Deployment | Render.com | — | High |

---

## Layer-by-Layer Analysis

---

### 1. Runtime — Node.js

**Choice:** Node.js 22.x LTS ("Jod") → upgrade path to 24.x LTS ("Krypton")

**Version:** 22.16.0 (current LTS); 24.x entered LTS April 2026

**Rationale:**
- Node.js 22 is the active LTS line (supported through April 2027). Node.js 24 just entered LTS status and is now the recommended line for new greenfield projects as of April 2026.
- Native `WebSocket` client API is available in Node.js ≥ 22 without a polyfill, which simplifies client-side WebSocket code.
- Both v22 and v24 are available on all target deployment platforms (Render, Railway, Fly.io).
- Node.js 20 is EOL — do not use. Node.js 18 is EOL — do not use.

**Recommendation:** Start with 22 (widely supported, battle-tested), plan to target 24 in production. Pin with `.nvmrc` or `engines` field in `package.json`.

**Confidence:** High — verified against nodejs.org release schedule.

---

### 2. HTTP Server — Express vs Fastify

**Choice:** Express 5

**Version:** 5.2.1 (stable, released 2025)

**Why Express 5 (not Fastify):**

| Criterion | Express 5 | Fastify 5 |
|---|---|---|
| Ecosystem maturity | 15+ years, universal familiarity | Newer but production-grade |
| Socket.io integration | First-class, officially documented | Requires `@fastify/websocket` plugin; Socket.io adapts to any `http.Server` |
| Boilerplate needed | Minimal — pass `httpServer` to Socket.io directly | Same pattern, but plugin wiring adds friction |
| Async error handling | Native in v5 (async/await `try/catch`) | Native from day 1 |
| Validation | Not needed for this project | Fastify's strength (JSON schema) is unused here |
| Performance ceiling | ~50k req/s (more than sufficient) | ~90k req/s (overkill at 20–100 clients) |

Express 5's main improvement over Express 4 is native async/await support without `express-async-errors` patches. That matters for this project's clean route handlers. The performance advantage of Fastify is irrelevant at 20–100 clients — this is not a high-throughput API.

**What NOT to use:**
- **Express 4** — still functional but superseded; async errors require workaround middleware.
- **Fastify + @fastify/websocket** — Socket.io bypasses Fastify's WS plugin entirely by attaching to the raw `http.Server`. Using Fastify adds setup complexity with zero benefit here.
- **Hono / Elysia** — Bun-first runtimes; overkill and mismatched for a Node.js target.
- **Koa** — lower community momentum than Express; no advantage for this use case.

**Confidence:** High

---

### 3. WebSocket Transport — Socket.io vs raw `ws` vs uWebSockets.js

**Choice:** Socket.io 4

**Version:** 4.8.3 (server) + 4.8.3 (client, via CDN or npm)

**Comparison:**

| Feature | Socket.io 4 | raw `ws` 8 | uWebSockets.js 20 |
|---|---|---|---|
| Auto-reconnection | Built-in (exponential backoff) | Manual | Manual |
| Fallback (long-polling) | Yes — survives proxy misconfiguration | No | No |
| Broadcasting / rooms | Built-in | Manual (iterate connections Set) | Manual |
| Reconnection state sync | Built-in (`socket.emit('buffer')` pattern) | Manual | Manual |
| Packet buffering on drop | Built-in | Manual | Manual |
| Event-based API | Yes (`emit`/`on`) | Raw binary frame parsing | Raw binary |
| Bundle size (browser) | ~10.4 kB gzipped | 0 (native WebSocket) | 0 (native) |
| Production usage | Massive (Trello, Notion patterns) | Moderate | Niche (ultra-high-throughput) |
| Proxy compatibility | Excellent (polling fallback) | Good (WS only) | Good (WS only) |

**Why Socket.io wins for this project:**

1. **Auto-reconnect is critical for venue WiFi.** Public venues (halls, community centres) have flaky WiFi. When a participant's phone drops briefly, Socket.io automatically reconnects and the server can re-emit the current game state. With raw `ws` you implement this yourself — and you will need to.

2. **Broadcasting is the primary operation.** Every number draw and every reset is a `io.emit(...)` to all clients. With raw `ws` this is `wss.clients.forEach(c => c.send(...))`. Socket.io's broadcast primitive is cleaner and handles partial failures.

3. **Polling fallback prevents "it doesn't work on hotel WiFi" complaints.** Corporate and venue networks frequently block non-port-443 WebSocket upgrades. Socket.io negotiates WebSocket and falls back to HTTP long-polling transparently.

4. **Reconnect + state re-sync pattern is well-documented.** On `connect` / `reconnect`, the client can request current game state from the server. Socket.io's acknowledgement API (`socket.emit('getState', cb)`) makes this trivial.

5. **20–100 clients is well within Socket.io's comfort zone.** Socket.io handles tens of thousands of connections on a single process. 100 connections is negligible.

**Why NOT raw `ws`:**
- You would manually implement reconnection logic, state re-sync, broadcasting, and connection tracking — all solved problems in Socket.io.
- The 10.4 kB bundle cost is irrelevant; participants are on a LAN/WiFi and load the page once.

**Why NOT uWebSockets.js:**
- Designed for C-level performance at 100k+ concurrent connections. This project handles 100 connections max.
- Non-standard Node.js-compatible API; can't attach to Express's `http.Server` conventionally.
- The performance headroom is not needed; operational complexity is not worth it.

**Confidence:** High

---

### 4. Frontend — Framework Choice

**Choice:** Vanilla JavaScript (no framework)

**Rationale:**
- The participant view is a **read-only display**: receive a number, update the DOM. No state management, no routing, no forms beyond the host's number input.
- The host view is a **form with one input and one button** plus a drawn-numbers grid.
- Adding React/Vue/Svelte introduces a build pipeline, hydration overhead, and component mental model for what is fundamentally a 200-line DOM manipulation problem.
- Socket.io's browser client (`/socket.io/socket.io.js` served automatically by the server) requires zero npm setup on the frontend.
- `localStorage` reads/writes are 2-line vanilla JS operations; no wrapper needed.

**Specific frontend approach:**
- Server serves static HTML files from an `public/` directory via `express.static`.
- Each page (`index.html` for participants, `host.html` for host) is a single HTML file with an inline `<script>` or a co-located `.js` file.
- No transpilation required — target modern browsers (ES2022+, native `class`, `fetch`, `localStorage`).

**What NOT to use:**
- **React/Next.js** — massive overkill for a display board.
- **Vue/Nuxt** — same reason.
- **Svelte** — appealing for its small output, but still requires a build step for what is 3 DOM queries.
- **jQuery** — no reason to reach for a DOM helper library that's been superseded by native APIs.
- **Vite (as a bundler)** — not needed for vanilla JS files served as static assets. *Optionally* useful if you want HMR during development, but adds setup complexity.

**Confidence:** High

---

### 5. Supporting Libraries

#### dotenv — 17.4.2
Load environment variables from `.env` during local development (`PORT`, any future secrets).
- In Node.js 22+, `--env-file=.env` CLI flag is a native alternative. Either is acceptable.
- **Confidence:** High

#### nodemon — 3.1.14 (devDependency)
Restarts the server on file changes during development. Standard tooling.
- Alternative: `node --watch` (native, Node.js ≥ 18). Either works; nodemon has richer ignore patterns.
- **Confidence:** High

#### No ORM / database driver
Server state is a plain JS object `{ drawnNumbers: [], lastNumber: null }`. No persistence library needed. `localStorage` is the client-side concern.

---

### 6. Deployment Platform

**Choice:** Render.com

**Rationale:**

| Platform | WebSocket Support | Free Tier | Auto-Deploy | Cold Starts | Notes |
|---|---|---|---|---|---|
| **Render** | ✅ Confirmed | ✅ Yes (with limits) | ✅ GitHub push | ⚠️ Free tier sleeps after inactivity | Bind to `PORT` env var |
| **Railway** | ✅ Yes (TCP/HTTP proxy) | ✅ $5 min Hobby | ✅ GitHub push | None on paid | Simple UX, generous limits |
| **Fly.io** | ✅ Yes | ✅ Free allowance | ✅ flyctl deploy | None | More DevOps overhead (config files, machines API) |

**Render** is the recommendation for this project:
1. **WebSocket connections are explicitly supported** per Render documentation.
2. **Free tier** exists for early testing (app sleeps after inactivity — acceptable for a game session where the host activates it shortly before play begins).
3. **Zero-config GitHub deploy** — push to main branch → deployed. No Docker knowledge needed.
4. **`PORT` env var** — Render injects `PORT`; Socket.io + Express bind to `process.env.PORT` automatically.
5. **HTTPS termination** — Render handles TLS; the app receives plain HTTP/WS internally. Socket.io works behind a reverse proxy by default.

**Railway** is an equally valid alternative (better for teams that want always-on at low cost). Fly.io is excellent but requires more DevOps familiarity (toml config, `flyctl`).

**Deployment caveat:** Free Render instances sleep after ~15 minutes of inactivity. For a live Bingo game, the host should open the app a minute before play to warm it up, or use the Render Hobby plan ($7/month) for always-on.

**Confidence:** High (Render), Medium (if always-on free tier is required — then Railway Hobby at $5/mo is better).

---

## What NOT to Use (and Why)

| Technology | Reason to Avoid |
|---|---|
| **Bun runtime** | Node.js is specified. Bun is not compatible with all npm packages (esp. native bindings) and deployment targets may not support it. |
| **Deno** | Not Node.js. Different module system; not specified. |
| **Socket.io v2/v3** | EOL. v4 is the only maintained line. |
| **Express 4** | Superseded by v5; async error handling requires a workaround. |
| **uWebSockets.js** | C-extension, not pure Node.js; extremely over-engineered for 100 connections. |
| **SSE (Server-Sent Events)** | One-directional (server→client only). Host sends data to server, so bidirectional is needed. Could work with SSE + REST but is inelegant. |
| **HTTP polling** | Adds latency, load, and complexity. WebSockets were chosen deliberately. |
| **Redis** | No multi-server scaling needed. One Node.js process handles 100 connections trivially. In-memory state is sufficient. |
| **MongoDB / PostgreSQL** | No database requirement defined. State resets on server restart by design. |
| **TypeScript** | Not disqualified, but adds a build step to a project spec'd as vanilla JS. Add it in v2 if the codebase grows. |
| **Docker** (for dev) | Unnecessary for a two-file Node.js app. Use Docker only if deployment requires it (Fly.io does; Render/Railway don't need it). |

---

## Final Package Manifest (Reference)

```json
{
  "engines": {
    "node": ">=22.0.0"
  },
  "dependencies": {
    "express": "^5.2.1",
    "socket.io": "^4.8.3",
    "dotenv": "^17.4.2"
  },
  "devDependencies": {
    "nodemon": "^3.1.14"
  }
}
```

Frontend (no npm): Socket.io browser client is served automatically at `/socket.io/socket.io.js` by the Socket.io server middleware — no separate install or CDN link needed.

---

## Architecture Diagram

```
Browser (Participant)          Browser (Host)
  /                              /host
  |                              |
  | WS (Socket.io client)        | WS (Socket.io client)
  |                              |
  └──────────────┬───────────────┘
                 │
         Express 5 HTTP Server
         + Socket.io 4 Server
                 │
         In-memory game state
         { drawn: [], last: null }
                 │
         Render.com (HTTPS termination)
         → public internet
```

Events flow:
- Host emits `draw` with number → server validates, updates state, broadcasts `numberDrawn` to all clients
- Host emits `reset` → server clears state, broadcasts `gameReset` to all clients
- Client emits `getState` on connect/reconnect → server responds with current state (acknowledgement callback)

---

## Open Questions

- **Multi-room support:** Is one global game state sufficient, or will multiple simultaneous games run? If multi-room: Socket.io rooms API handles this with zero extra dependencies.
- **Host authentication:** URL secrecy (obscure `/host/some-token`) is acceptable for casual use. If stronger auth is needed later, `express-session` or a simple `Bearer` token check on the socket handshake.
- **Reconnect state sync strategy:** On Socket.io `reconnect` event, client should re-request full state (`getState`). Alternatively, server pushes current state on every new connection. Decide during implementation.

---

*Versions verified via npm registry live query on 2026-05-10. Re-verify before pinning in production.*
