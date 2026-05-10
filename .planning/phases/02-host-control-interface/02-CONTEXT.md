# Phase 2: Host Control Interface - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the host's ability to manage the game: registering drawn numbers (1–90) and resetting the game state. It includes the `/host` view with authenticated access control via a URL secret key and real-time propagation of host actions to all connected participants.

</domain>

<decisions>
## Implementation Decisions

### Host Authentication
- **D-01:** Authenticate host actions via a secret key passed in the URL (e.g., `/host?key=...`).
- **D-02:** The client must send this key during the WebSocket handshake or as part of host-only event payloads for server-side validation.

### Number Registration
- **D-03:** Host registers numbers via a full 1–90 button grid (tap to draw).
- **D-04:** Server must prevent duplicates and validate that the number is within the 1–90 range.

### Game Management
- **D-05:** 'Reset Game' action must be protected by a confirmation dialog to prevent accidental wipes.
- **D-06:** Reset action clears the authoritative server state and propagates the clear to all clients in real time.

### Host UI/UX
- **D-07:** Unified View: The host interface should show the same board/grid as participants, with additional overlay controls for number selection and resetting.

### Claude's Discretion
- Specific styling of the 1–90 grid and the layout of the host controls.
- The format and generation logic for the host secret key (likely a UUID or similar).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/PROJECT.md` — Project goals and core value.
- `.planning/REQUIREMENTS.md` — v1 requirements (AUTH-01, HOST-01, HOST-02, HOST-03).
- `SKELETON.md` — Walking skeleton architecture.

### Research
- `.planning/research/PITFALLS.md` — Pitfalls 5 (Host URL security) and 6 (Registration validation).
- `.planning/research/SUMMARY.md` — Phase 2 rationale and feature set.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `server.js`: Express/Socket.io setup and `gameState` object.
- `public/app.js`: Real-time event handling logic (can be adapted for host specific events).
- `public/style.css`: Basic Bingo styling.

### Established Patterns
- **SYNC protocol**: Server-authoritative state push on connection.
- **Atomic updates**: Real-time push for new numbers.

### Integration Points
- `server.js`: New event listeners for `drawNumber` and `resetGame` with validation.
- `public/index.html`: Addition of `/host` route or separate `host.html` page.

</code_context>

<specifics>
## Specific Ideas

- Host view should be mobile-friendly, as the host may be walking around a venue.
- Button grid should have clear visual feedback when a number is pressed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 2-Host Control Interface*
*Context gathered: 2026-05-10*
