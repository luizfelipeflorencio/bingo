# Bingo Live

## What This Is

A web-based real-time Bingo management system for in-person games. The host draws physical balls and registers each number into the system; all connected participants instantly see the drawn number appear on their screens without refreshing. It supplements physical Bingo cards — it does not replace them.

## Core Value

Every participant always sees the current drawn number the instant it is registered — zero-refresh, zero-lag, zero-missed calls.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Host can register a drawn number (1–90) via a dedicated host URL
- [ ] All connected participants see the new number appear in real time (WebSocket push)
- [ ] Most recently drawn number is displayed prominently in large format
- [ ] Previously drawn numbers remain visible in a smaller numbered grid/list
- [ ] LocalStorage preserves game state across page refreshes for all clients
- [ ] Host can reset/clear the current round from the host interface
- [ ] Reset propagates to all connected clients in real time (their screens clear too)
- [ ] Only the host (separate URL) can register numbers and reset the game
- [ ] System handles 20–100 simultaneous participant connections
- [ ] Responsive UI — works on phones and tablets in a venue setting

### Out of Scope

- Digital Bingo cards on participant devices — players use physical cards
- Automatic winner detection — winners are called out verbally
- Digital "Bingo!" button for players — no per-player interaction needed
- User accounts / authentication — host URL is the access control mechanism
- 75-ball (US) variant — 90-ball only for v1
- LAN-only mode — targets public internet deployment

## Context

- **Format**: 90-ball Bingo (numbers 1–90), standard UK/Brazil ruleset
- **Access model**: Two distinct URLs — `/host` for the game operator (number input, reset), `/` or `/view` for participants (display only)
- **Real-time transport**: WebSockets via Node.js — chosen for low-latency push to 20–100 concurrent clients
- **Persistence**: LocalStorage on the client side to survive page refreshes; server holds authoritative game state in memory (reset on server restart)
- **Deployment**: Public internet — needs to work over HTTPS, handle multiple concurrent rooms if needed

## Constraints

- **Tech Stack**: Node.js backend (Express or Fastify + ws/Socket.io), vanilla JS or lightweight framework frontend
- **Scale**: ~20–100 simultaneous WebSocket connections per game session
- **Simplicity**: No user accounts, no database required for v1 — in-memory server state + client LocalStorage
- **Deployment**: Public internet; must work behind HTTPS reverse proxy (e.g. Railway, Render, Fly.io)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Separate host URL for access control | No accounts needed; URL secrecy is sufficient for casual in-person games | — Pending |
| 90-ball format only | Matches target use case (UK/Brazil); 75-ball can be added later | — Pending |
| WebSockets for real-time | Lower latency than SSE or polling for push-heavy use case at this scale | — Pending |
| In-memory state + LocalStorage | Simplest viable architecture; no DB dependency for v1 | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-10 after initialization*
