<!-- GSD:project-start source:PROJECT.md -->
## Project

**Bingo Live**

A web-based real-time Bingo management system for in-person games. The host draws physical balls and registers each number into the system; all connected participants instantly see the drawn number appear on their screens without refreshing. It supplements physical Bingo cards — it does not replace them.

**Core Value:** Every participant always sees the current drawn number the instant it is registered — zero-refresh, zero-lag, zero-missed calls.

### Constraints

- **Tech Stack**: Node.js backend (Express or Fastify + ws/Socket.io), vanilla JS or lightweight framework frontend
- **Scale**: ~20–100 simultaneous WebSocket connections per game session
- **Simplicity**: No user accounts, no database required for v1 — in-memory server state + client LocalStorage
- **Deployment**: Public internet; must work behind HTTPS reverse proxy (e.g. Railway, Render, Fly.io)
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

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
## Layer-by-Layer Analysis
### 1. Runtime — Node.js
- Node.js 22 is the active LTS line (supported through April 2027). Node.js 24 just entered LTS status and is now the recommended line for new greenfield projects as of April 2026.
- Native `WebSocket` client API is available in Node.js ≥ 22 without a polyfill, which simplifies client-side WebSocket code.
- Both v22 and v24 are available on all target deployment platforms (Render, Railway, Fly.io).
- Node.js 20 is EOL — do not use. Node.js 18 is EOL — do not use.
### 2. HTTP Server — Express vs Fastify
| Criterion | Express 5 | Fastify 5 |
|---|---|---|
| Ecosystem maturity | 15+ years, universal familiarity | Newer but production-grade |
| Socket.io integration | First-class, officially documented | Requires `@fastify/websocket` plugin; Socket.io adapts to any `http.Server` |
| Boilerplate needed | Minimal — pass `httpServer` to Socket.io directly | Same pattern, but plugin wiring adds friction |
| Async error handling | Native in v5 (async/await `try/catch`) | Native from day 1 |
| Validation | Not needed for this project | Fastify's strength (JSON schema) is unused here |
| Performance ceiling | ~50k req/s (more than sufficient) | ~90k req/s (overkill at 20–100 clients) |
- **Express 4** — still functional but superseded; async errors require workaround middleware.
- **Fastify + @fastify/websocket** — Socket.io bypasses Fastify's WS plugin entirely by attaching to the raw `http.Server`. Using Fastify adds setup complexity with zero benefit here.
- **Hono / Elysia** — Bun-first runtimes; overkill and mismatched for a Node.js target.
- **Koa** — lower community momentum than Express; no advantage for this use case.
### 3. WebSocket Transport — Socket.io vs raw `ws` vs uWebSockets.js
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
- You would manually implement reconnection logic, state re-sync, broadcasting, and connection tracking — all solved problems in Socket.io.
- The 10.4 kB bundle cost is irrelevant; participants are on a LAN/WiFi and load the page once.
- Designed for C-level performance at 100k+ concurrent connections. This project handles 100 connections max.
- Non-standard Node.js-compatible API; can't attach to Express's `http.Server` conventionally.
- The performance headroom is not needed; operational complexity is not worth it.
### 4. Frontend — Framework Choice
- The participant view is a **read-only display**: receive a number, update the DOM. No state management, no routing, no forms beyond the host's number input.
- The host view is a **form with one input and one button** plus a drawn-numbers grid.
- Adding React/Vue/Svelte introduces a build pipeline, hydration overhead, and component mental model for what is fundamentally a 200-line DOM manipulation problem.
- Socket.io's browser client (`/socket.io/socket.io.js` served automatically by the server) requires zero npm setup on the frontend.
- `localStorage` reads/writes are 2-line vanilla JS operations; no wrapper needed.
- Server serves static HTML files from an `public/` directory via `express.static`.
- Each page (`index.html` for participants, `host.html` for host) is a single HTML file with an inline `<script>` or a co-located `.js` file.
- No transpilation required — target modern browsers (ES2022+, native `class`, `fetch`, `localStorage`).
- **React/Next.js** — massive overkill for a display board.
- **Vue/Nuxt** — same reason.
- **Svelte** — appealing for its small output, but still requires a build step for what is 3 DOM queries.
- **jQuery** — no reason to reach for a DOM helper library that's been superseded by native APIs.
- **Vite (as a bundler)** — not needed for vanilla JS files served as static assets. *Optionally* useful if you want HMR during development, but adds setup complexity.
### 5. Supporting Libraries
#### dotenv — 17.4.2
- In Node.js 22+, `--env-file=.env` CLI flag is a native alternative. Either is acceptable.
- **Confidence:** High
#### nodemon — 3.1.14 (devDependency)
- Alternative: `node --watch` (native, Node.js ≥ 18). Either works; nodemon has richer ignore patterns.
- **Confidence:** High
#### No ORM / database driver
### 6. Deployment Platform
| Platform | WebSocket Support | Free Tier | Auto-Deploy | Cold Starts | Notes |
|---|---|---|---|---|---|
| **Render** | ✅ Confirmed | ✅ Yes (with limits) | ✅ GitHub push | ⚠️ Free tier sleeps after inactivity | Bind to `PORT` env var |
| **Railway** | ✅ Yes (TCP/HTTP proxy) | ✅ $5 min Hobby | ✅ GitHub push | None on paid | Simple UX, generous limits |
| **Fly.io** | ✅ Yes | ✅ Free allowance | ✅ flyctl deploy | None | More DevOps overhead (config files, machines API) |
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
## Final Package Manifest (Reference)
## Architecture Diagram
- Host emits `draw` with number → server validates, updates state, broadcasts `numberDrawn` to all clients
- Host emits `reset` → server clears state, broadcasts `gameReset` to all clients
- Client emits `getState` on connect/reconnect → server responds with current state (acknowledgement callback)
## Open Questions
- **Multi-room support:** Is one global game state sufficient, or will multiple simultaneous games run? If multi-room: Socket.io rooms API handles this with zero extra dependencies.
- **Host authentication:** URL secrecy (obscure `/host/some-token`) is acceptable for casual use. If stronger auth is needed later, `express-session` or a simple `Bearer` token check on the socket handshake.
- **Reconnect state sync strategy:** On Socket.io `reconnect` event, client should re-request full state (`getState`). Alternatively, server pushes current state on every new connection. Decide during implementation.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
