# Phase 2: Host Control Interface - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-10
**Phase:** 2-Host Control Interface
**Areas discussed:** Host Auth, Input Method, Reset Flow, Host UI

---

## Host Auth

| Option | Description | Selected |
|--------|-------------|----------|
| URL Secret Key | A secret key in the URL (e.g., /host?key=xyz) passed during the handshake. | ✓ |
| Password field | A simple password field on the host page. | |
| Obfuscated Route | Hardcoded route (e.g. /host-control-panel-xyz) with no extra auth. | |

**User's choice:** URL Secret Key
**Notes:** Preferred for its simplicity and ease of use in casual settings without requiring account management.

---

## Input Method

| Option | Description | Selected |
|--------|-------------|----------|
| 1–90 Button Grid | A 1–90 grid of buttons; tap a number to mark it as drawn. | ✓ |
| Keypad Input | A numeric keypad input (type 1–90 and press 'Enter'). | |
| Other | Voice command or other input method. | |

**User's choice:** 1–90 Button Grid
**Notes:** Most intuitive for a physical bingo host who needs to quickly mark off what was drawn.

---

## Reset Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm Dialog | A confirmation dialog to prevent accidental resets. | ✓ |
| Immediate Reset | Immediate reset with no confirmation. | |
| Long-press Reset | Long-press (3s) to reset. | |

**User's choice:** Confirm Dialog
**Notes:** Standard safety measure for a destructive action.

---

## Host UI

| Option | Description | Selected |
|--------|-------------|----------|
| Unified Board View+Controls | Host sees the same grid as participants plus the input controls. | ✓ |
| Control Panel Only | Minimal host panel (input only, no full board display). | |

**User's choice:** Unified Board View+Controls
**Notes:** Keeps the host in sync with what the audience is seeing.

---

## Claude's Discretion

- Visual styling of the grid.
- Key generation logic.

## Deferred Ideas

None.
