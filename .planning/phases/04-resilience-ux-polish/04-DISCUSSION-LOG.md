# Phase 4: Resilience & UX Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 4-Resilience & UX Polish
**Areas discussed:** Persistence Hardening, Mobile UX Polish

---

## Persistence Hardening

| Option | Description | Selected |
|--------|-------------|----------|
| File-based Persistence | Save the authoritative game state to a local file (gameState.json) on the server. Minimal complexity, survives restarts. | ✓ |
| Client-side Reconstruction | Only rely on LocalStorage. If the server restarts, the first client to connect 'restores' the state to the server. | |
| No Server Persistence | Stick with in-memory only for v1. If it restarts, the game is lost. | |

**User's choice:** File-based Persistence
**Notes:** Provides the best balance of reliability and simplicity without needing a full database.

---

## Mobile UX Polish

| Option | Description | Selected |
|--------|-------------|----------|
| Universal Responsive | Keep the projector layout for all screens but scale it down. Host buttons stay in a grid but get larger touch areas. | ✓ |
| Device-specific Views | Host: grid view; Participant: simplified 'Current Number Only' view on phones. | |
| Orientation Lock (Host) | Lock host screen to landscape to ensure the 90-button grid fits without scrolling. | |

**User's choice:** Universal Responsive
**Notes:** Ensures a consistent brand and experience across all participant devices.

---

## Claude's Discretion

- Typography scaling for mobile.
- Throttling logic for file writes.
- Selection of sound effects (if time permits).

## Deferred Ideas

- Sound Feedback (OPT-01) - Noted as optional polish if core resilience is completed early.
- Game Progress UI (OPT-02) - Ball counts (Called/Remaining) deferred.
