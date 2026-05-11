# Phase 3: Visual Bingo Display - Context

**Gathered:** 2026-05-10
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the comprehensive visual display for participants. It focuses on the layout of the "Bingo Board", including a prominent current number display, a full 1–90 grid showing all called numbers, and a history strip of the latest 5 calls. It also includes visual feedback animations for real-time updates.

</domain>

<decisions>
## Implementation Decisions

### Board Layout
- **D-01:** "Top Heavy" layout: The most recently drawn number is displayed HUGE at the top of the screen.
- **D-02:** The 1–90 grid is displayed below the current number, filling the remaining space.

### Call History
- **D-03:** "Latest 5" strip: A horizontal bar showing the 5 most recently drawn numbers (excluding the current one) is displayed between the huge number and the grid (or at the bottom).

### Visual Feedback
- **D-04:** Whenever a new number is drawn, the huge number display and the corresponding cell in the grid should perform a "Pulse & Flash" animation to grab attention.

### Empty State
- **D-05:** Before any numbers are drawn, the board displays a dimmed 1–90 grid and the text "Waiting for game to start..." or similar.

### Claude's Discretion
- Specific color palette for the "flash" (likely a bright yellow or green).
- Typography choices for the huge number to ensure visibility from a distance.
- Exact placement of the history strip (top vs bottom of the grid).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Core
- `.planning/PROJECT.md` — Core value: "zero-missed calls".
- `.planning/REQUIREMENTS.md` — v1 requirements (DISP-01, DISP-02, DISP-03).
- `SKELETON.md` — Unified server/client architecture.

### Prior Context
- `.planning/phases/02-host-control-interface/02-CONTEXT.md` — Unified Board View decision (D-07).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `public/style.css`: Basic grid styles.
- `public/app.js`: `renderState` and `addNumberToHistory` functions (to be refactored/expanded).

### Established Patterns
- **SYNC handle**: The client already receives the full `drawnNumbers` list on connection.
- **numberDrawn event**: Real-time push trigger.

### Integration Points
- `public/index.html`: Refactoring the DOM structure to support the Top Heavy layout.
- `public/app.js`: Updating the render logic to handle animations and history slicing.

</code_context>

<specifics>
## Specific Ideas

- The "Pulse & Flash" should be achievable with pure CSS animations (e.g. `@keyframes pulse`).
- The huge number should be readable from 10+ meters away (projector use case).

</specifics>

<deferred>
## Deferred Ideas

- Sound effects (OPT-01) — Belongs in Phase 4 Resilience & UX Polish.
- Called/remaining counts (OPT-02) — Belongs in Phase 4.

</deferred>

---

*Phase: 3-Visual Bingo Display*
*Context gathered: 2026-05-10*
