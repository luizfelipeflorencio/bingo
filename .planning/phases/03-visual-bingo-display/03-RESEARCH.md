# Phase 3: Visual Bingo Display - Research

**Researched:** 2026-05-10
**Domain:** Large-screen visualization, CSS Animations, Responsive Layouts
**Confidence:** HIGH

## Summary

This phase focuses on transforming the participant view into a "Top Heavy" display optimized for projectors and large screens. Key requirements include a massive current number display (readable from 10m), a full 1–90 grid, and a history strip. Research confirms that for 10-meter viewing distances, a minimum of 4–5 inches (approx. 400-500px depending on DPI) in physical height for text is required. Performance-wise, "Pulse & Flash" effects are best implemented using CSS hardware-accelerated properties (`transform`, `opacity`) to avoid layout thrashing on large displays.

**Primary recommendation:** Use a Flexbox/Grid hybrid layout with `vh` units for the huge number to ensure it scales with screen height, and leverage CSS `@keyframes` with `will-change` for the animations.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** "Top Heavy" layout: The most recently drawn number is displayed HUGE at the top of the screen.
- **D-02:** The 1–90 grid is displayed below the current number, filling the remaining space.
- **D-03:** "Latest 5" strip: A horizontal bar showing the 5 most recently drawn numbers (excluding the current one) is displayed between the huge number and the grid (or at the bottom).
- **D-04:** Whenever a new number is drawn, the huge number display and the corresponding cell in the grid should perform a "Pulse & Flash" animation to grab attention.
- **D-05:** Before any numbers are drawn, the board displays a dimmed 1–90 grid and the text "Waiting for game to start..." or similar.

### Claude's Discretion
- Specific color palette for the "flash" (likely a bright yellow or green).
- Typography choices for the huge number to ensure visibility from a distance.
- Exact placement of the history strip (top vs bottom of the grid).

### Deferred Ideas (OUT OF SCOPE)
- Sound effects (OPT-01) — Belongs in Phase 4 Resilience & UX Polish.
- Called/remaining counts (OPT-02) — Belongs in Phase 4.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DISP-01 | Most recently drawn number displayed prominently. | Typographic scale research for 10m viewing. |
| DISP-02 | Grid of numbers 1–90 showing all called numbers. | Grid layout optimization for 90 cells. |
| DISP-03 | Recent call history strip (last 5 numbers). | Slice logic for array management in Vanilla JS. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| State Synchronization | API / Backend | Browser | Server is source of truth via Socket.io. |
| View Rendering | Browser / Client | — | Vanilla JS DOM manipulation for layout. |
| Animations | Browser (GPU) | — | CSS hardware acceleration for smooth 60fps. |
| Persistence | LocalStorage | — | Client-side recovery for refresh resilience. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Socket.io | 4.8.3 | Real-time push | Industry standard for low-latency events. |
| Express | 5.2.1 | Web server | Latest stable for serving assets/API. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| Vanilla JS | — | UI Logic | Minimal overhead, zero-build requirement. |
| CSS3 | — | Layout & Anim | Flexbox/Grid/Keyframes are sufficient. |

**Installation:**
```bash
# No new packages needed for this phase
```

## Architecture Patterns

### Recommended Project Structure
```
public/
├── index.html       # Refactored for "Top Heavy" layout
├── style.css        # Added keyframes and grid variables
└── app.js           # Updated render logic for history/animations
```

### Pattern 1: GPU-Accelerated Pulse & Flash
**What:** Using `transform: scale()` and `opacity` instead of animating `font-size` or `background-color` (though background-color is often acceptable on modern GPUs, `transform` is safest).
**When to use:** On the huge current number and the grid cell highlighting.
**Example:**
```css
@keyframes pulse-flash {
  0% { transform: scale(1); background-color: #007bff; }
  50% { transform: scale(1.1); background-color: #ffeb3b; box-shadow: 0 0 30px #ffeb3b; }
  100% { transform: scale(1); background-color: #007bff; }
}
.animate-new {
  animation: pulse-flash 0.8s ease-out;
  will-change: transform, background-color;
}
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid Layout math | Manual JS positioning | CSS Grid | Browser handles resizing/reflow natively. |
| Animation timing | `setInterval` for colors | CSS Transitions/Keyframes | CSS is smoother and handles interruptions better. |
| State diffing | Complex VDOM | Full re-render (small scale) | 90 numbers is small enough for a full DOM update on change. |

## Common Pitfalls

### Pitfall 1: Font Legibility
**What goes wrong:** Huge numbers look "pixelated" or "thin" on projectors.
**Why it happens:** Projectors often have lower contrast or slight blurring.
**How to avoid:** Use thick, sans-serif fonts (e.g., Inter, Roboto Black) and high-contrast colors (white on dark blue or vice versa).

### Pitfall 2: Layout Overflow
**What goes wrong:** The 1-90 grid gets pushed off-screen when the "Huge" number is too large.
**Why it happens:** Fixed `px` values for the top section.
**How to avoid:** Use `flex-grow` or `calc(100vh - constant)` to ensure the grid always fits the remaining viewport.

## Code Examples

### Managing the "Latest 5" History
```javascript
// Source: Internal logic for DISP-03
function getLatestHistory(allNumbers) {
    // Current number is typically the last one in the list
    const current = allNumbers[allNumbers.length - 1];
    // History is the 5 before it
    return allNumbers.slice(-6, -1).reverse();
}
```

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | 100vh is sufficient for both huge number and grid. | Summary | Might need scrolling on very small height displays. |
| A2 | Background-color animation performance is negligible. | Pattern 1 | Low-end projector-connected PCs might stutter. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Socket.io | Real-time | ✓ | 4.8.3 | — |
| Browser (Chrome/FF) | Display | ✓ | Latest | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Manual Visual Check / Playwright (optional) |
| Quick run command | `npm start` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DISP-01 | Current number visible at 10m. | Smoke (Visual) | — | ✅ |
| DISP-02 | All 90 cells render correctly. | Smoke (Visual) | — | ✅ |
| DISP-03 | Exactly 5 history items shown. | Unit (JS) | `node tests/history.test.js` | ❌ Wave 0 |

## Sources

### Primary (HIGH confidence)
- `SKELETON.md` / `.planning/CONTEXT.md` - Verified architecture.
- [Microsoft Accessibility Guidelines](https://learn.microsoft.com/en-us/accessibility/visual-design) - Referenced for viewing distances.
- [MDN CSS Animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations) - Verified performance properties.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Simple Express/Socket.io setup.
- Architecture: HIGH - Clear separation of host/viewer.
- Pitfalls: MEDIUM - Based on common projector deployment issues.

**Research date:** 2026-05-10
**Valid until:** 2026-06-10
