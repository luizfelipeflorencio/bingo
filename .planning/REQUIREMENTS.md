# Requirements: Bingo Live

**Defined:** 2026-05-10
**Core Value:** Every participant always sees the current drawn number the instant it is registered — zero-refresh, zero-lag, zero-missed calls.

## v1 Requirements

Requirements for initial release.

### Authentication & Access

- [ ] **AUTH-01**: Host access via dedicated `/host` URL with token-based WebSocket validation.
- [ ] **AUTH-02**: Participant access via public `/` or `/view` URL (read-only).

### Game Logic & Input (Host)

- [ ] **HOST-01**: Host can register drawn numbers (1–90) via a simple number pad/input.
- [ ] **HOST-02**: System prevents duplicate numbers or invalid ranges (correctness).
- [ ] **HOST-03**: Host can reset the current game state to start a new round.

### Live Display (Participants)

- [ ] **DISP-01**: Most recently drawn number displayed prominently in a large format.
- [ ] **DISP-02**: Grid of numbers 1–90 showing all previously called numbers highlighted.
- [ ] **DISP-03**: Recent call history strip (last 5 numbers).
- [ ] **DISP-04**: Real-time updates via Socket.io (no page refresh).

### Resilience & State

- [ ] **SYNC-01**: New participants receive current game state immediately upon connection (replay).
- [ ] **SYNC-02**: LocalStorage persists UI state across page refreshes for all clients.
- [ ] **SYNC-03**: Server state unconditionally overwrites client cache on connection.

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhancement

- **OPT-01**: Sound effects/chimes on number calls.
- **OPT-02**: Called/remaining count display.
- **OPT-03**: QR code generator on host screen for easy participant joining.

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Digital cards for players | Players use physical cards; project is a supplementary display |
| Auto winner detection | Impossible without knowing players' cards; verbal calls preserved |
| User accounts | Auth complexity with zero gameplay value; URL/Token secrecy sufficient |
| 75-ball (US) variant | 90-ball (UK/Brazil) is the primary target for v1 |
| Database | In-memory state sufficient for current scale and requirements |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
| AUTH-02 | Phase 1 | Pending |
| HOST-01 | Phase 2 | Pending |
| HOST-02 | Phase 2 | Pending |
| HOST-03 | Phase 2 | Pending |
| DISP-01 | Phase 3 | Pending |
| DISP-02 | Phase 3 | Pending |
| DISP-03 | Phase 3 | Pending |
| DISP-04 | Phase 1 | Pending |
| SYNC-01 | Phase 3 | Pending |
| SYNC-02 | Phase 4 | Pending |
| SYNC-03 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-10*
*Last updated: 2026-05-10 after initial definition*
