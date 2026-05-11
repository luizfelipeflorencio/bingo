# Phase 3: Visual Bingo Display - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 3-Visual Bingo Display
**Areas discussed:** Layout, History, Animations, Empty State

---

## Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Top Heavy (Projector) | Huge current number at the top, full grid below. Best for projectors and large screens. | ✓ |
| Sidebar Layout | Current number in a sidebar, grid occupies most of the screen. | |
| Overlay Layout | Current number centered as a modal/overlay whenever a new draw occurs. | |

**User's choice:** Top Heavy (Projector)
**Notes:** Optimized for venue visibility.

---

## History

| Option | Description | Selected |
|--------|-------------|----------|
| Latest 5 Strip | A simple horizontal strip showing the latest 5 numbers called. | ✓ |
| Full Scrollable List | A vertical list showing the complete history of the round. | |
| Grid Only | No history bar, only the current number and grid. | |

**User's choice:** Latest 5 Strip
**Notes:** Provides enough context without cluttering the display.

---

## Animations

| Option | Description | Selected |
|--------|-------------|----------|
| Pulse & Flash | A prominent pulse and color flash whenever a new number is drawn. | ✓ |
| No Animation | Immediate update with no visual flair. | |
| Rolling Effect | A "randomizer" spin effect for 1s before showing the actual number. | |

**User's choice:** Pulse & Flash
**Notes:** Adds necessary visual feedback for a real-time event.

---

## Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Dimmed Grid + Text | Show "Waiting for game..." with a dimmed 1-90 grid. | ✓ |
| Splash Screen | Show a splash screen or logo until the first draw. | |
| Empty Grid | Just the empty grid. | |

**User's choice:** Dimmed Grid + Text
**Notes:** Keeps the structure visible while indicating readiness.

---

## Claude's Discretion

- Color palette for animations.
- Typographic scale for distance visibility.

## Deferred Ideas

- Sound effects.
- Counts/statistics.
