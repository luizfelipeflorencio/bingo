# Phase 4: Resilience & UX Polish - Context

**Gathered:** 2026-05-11
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase ensures the system is resilient to crashes/restarts and provides a polished experience on mobile devices. It covers server-side persistence (saving state to disk), client-side persistence (LocalStorage hardening), and responsive UI refinements for the "Top Heavy" participant view and the 90-button host interface.

</domain>

<decisions>
## Implementation Decisions

### Persistence Hardening
- **D-01:** File-based Persistence: The server will save the authoritative game state to a local file (`gameState.json`) to survive process restarts or server crashes.
- **D-02:** LocalStorage Hardening: Clients will continue to use LocalStorage to cache state, ensuring they don't see a "blank" screen during short disconnects or before the server pushes the initial `SYNC`.

### Mobile UX Polish
- **D-03:** Universal Responsive: The "Top Heavy" projector-first layout will be scaled for phones rather than creating a separate mobile-only view. This ensures consistency across all participant devices.
- **D-04:** Host UI Refinement: The 90-button grid on the host view will receive larger touch targets and "safe area" padding to ensure usability on various mobile devices and orientations.

### Claude's Discretion
- Selection of sound effects (if added as part of polish).
- Specific typography scaling for mobile vs projector.
- Implementation details of the file-save throttle (to avoid disk thrashing on rapid draws).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/PROJECT.md` — Core value: "zero-missed calls".
- `.planning/REQUIREMENTS.md` — v1 requirements (SYNC-02).
- `SKELETON.md` — Unified server/client architecture.

### Prior Context
- `.planning/phases/03-visual-bingo-display/03-CONTEXT.md` — Layout decisions (D-01, D-03).
- `.planning/phases/02-host-control-interface/02-CONTEXT.md` — Host interface baseline.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/app.js`: Existing `localStorage` read/write functions.
- `public/style.css`: Existing `@media` queries for responsive grid.

### Established Patterns
- **SYNC handle**: The client already receives the full state on connection.
- **In-memory state**: Server currently uses a `gameState` object.

### Integration Points
- `server.js`: Adding `fs` calls to persist `gameState` on update.
- `public/style.css`: Enhancing media queries for better mobile scaling.

</code_context>

<specifics>
## Specific Ideas

- The `gameState.json` should be updated whenever a number is drawn or the game is reset.
- Use a `throttle` or `debounce` on file writes if performance becomes an issue.

</specifics>

<deferred>
## Deferred Ideas

- Sound Feedback (OPT-01) - Decided to keep current scope focused on persistence and layout first; can be added if time permits.
- Game Progress UI (OPT-02) - Ball counts (Called/Remaining) deferred to next polish round or v2.

</deferred>

---

*Phase: 4-Resilience & UX Polish*
*Context gathered: 2026-05-11*
