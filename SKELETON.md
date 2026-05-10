# SKELETON.md — Bingo Live

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Runtime | Node.js 22.x | Active LTS with native WebSocket support |
| HTTP Server | Express 5.x | Standard, minimal boilerplate, async/await support |
| Real-time | Socket.io 4.x | Auto-reconnect, rooms, fallbacks, easy broadcasting |
| Frontend | Vanilla JS | No build step, direct DOM manipulation for simple UI |
| State | In-memory | No DB needed for v1 scale (~100 clients); state resets on restart |
| Persistence | LocalStorage | Client-side cache for refresh recovery |

## Core Components

- **Server**: Single-process Node.js app handling HTTP and WebSockets on the same port.
- **Protocol**: Event-based JSON over Socket.io (`sync`, `draw`, `reset`).
- **Clients**: 
    - `/` (Participant): Read-only view, re-hydrates from server.
    - `/host` (Host): Control panel for drawing numbers and resetting.

## Directory Layout

```text
bingo/
├── server.js            # Unified server entry point
├── public/              # Static assets
│   ├── index.html       # Participant entry
│   ├── host.html        # Host entry
│   ├── app.js           # Shared/Participant logic
│   ├── host.js          # Host-specific logic
│   └── style.css        # Shared styles
├── .env                 # Environment variables
├── package.json         # Dependencies
└── .planning/           # GSD documentation
```

## Security Model

- **Host Access**: Protected by a long, unguessable URL slug (e.g., `/host/a7f3k9...`).
- **Enforcement**: Server validates the host token in the URL against the WebSocket handshake. Only connections with the host token can emit `draw` or `reset` events.

## Deployment Strategy

- **Platform**: Render.com (Native WebSocket support, zero-config deploys).
- **Environment**: Single `$PORT` for both Express and Socket.io.
- **State Policy**: In-memory. Restarts clear the game. (Known limitation for free tier).

---
*Created 2026-05-10 for Phase 1 Foundation*
