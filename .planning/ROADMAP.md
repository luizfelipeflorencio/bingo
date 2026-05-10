# Roadmap: Bingo Live

## Phases

- [x] **Phase 1: Foundation & Real-time Communication** - Establish the basic server-client link for live updates.
- [ ] **Phase 2: Host Control Interface** - Implement the host's ability to manage the game and push numbers.
- [ ] **Phase 3: Visual Bingo Display** - Create the comprehensive display for participants with history and state replay.
- [ ] **Phase 4: Resilience & UX Polish** - Ensure state persistence across refreshes and responsive design.

## Phase Details

### Phase 1: Foundation & Real-time Communication
**Goal**: Establish the basic server-client link for live updates.
**Mode:** mvp
**Depends on**: Nothing
**Requirements**: AUTH-02, DISP-04, SYNC-01, SYNC-03
**Success Criteria** (what must be TRUE):
  1. User can access the root URL (`/`) and see a connected status.
  2. Server can push a test "number drawn" event and the participant screen updates instantly without refresh.
  3. Late-joining clients receive the current game state on connection (SYNC-01).
  4. Server state is the source of truth if client LocalStorage drifts (SYNC-03).
**Plans:** 2/2 plans executed
- [x] 01-01-PLAN.md — Walking Skeleton (Express + Socket.io)
- [x] 01-02-PLAN.md — State Sync & Authority Handling
**UI hint**: yes

### Phase 2: Host Control Interface
**Goal**: Implement the host's ability to manage the game and push numbers.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-01, HOST-01, HOST-02, HOST-03
**Success Criteria** (what must be TRUE):
  1. Host connects to `/host` via secret URL key (AUTH-01).
  2. Host registers numbers 1–90; server rejects invalid/duplicate numbers (HOST-01, HOST-02).
  3. Host resets game state with confirmation; state clears for all clients (HOST-03).
**Plans:** 2 plans
Plans:
- [ ] 02-01-PLAN.md — Host Authentication & Handshake Middleware
- [ ] 02-02-PLAN.md — Host Number Pad & Game Reset Controls
**UI hint**: yes

### Phase 3: Visual Bingo Display
**Goal**: Create the comprehensive display for participants with history and state replay.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: DISP-01, DISP-02, DISP-03
**Success Criteria** (what must be TRUE):
  1. Participant screen shows the most recent number in a prominent large display.
  2. A 1–90 grid highlights all numbers called so far.
  3. A history bar shows the last 5 numbers called in order.
**Plans**: TBD
**UI hint**: yes

### Phase 4: Resilience & UX Polish
**Goal**: Ensure state persistence across refreshes and responsive design.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: SYNC-02
**Success Criteria** (what must be TRUE):
  1. Refreshing the browser page does not lose the current highlights on the Bingo grid via LocalStorage cache.
  2. The UI is fully usable on a mobile phone in portrait and landscape orientation.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Communication | 2/2 | Completed| 2026-05-10 |
| 2. Host Control Interface | 0/2 | Not started | - |
| 3. Visual Bingo Display | 0/0 | Not started | - |
| 4. Resilience & UX Polish | 0/0 | Not started | - |
