# Roadmap: Bingo Live

## Phases

- [ ] **Phase 1: Foundation & Real-time Communication** - Establish the basic server-client link for live updates.
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
**Plans:** 1/2 plans executed
- [x] 01-01-PLAN.md — Walking Skeleton (Express + Socket.io)
- [x] 01-02-PLAN.md — State Sync & Authority Handling
**UI hint**: yes

### Phase 2: Host Control Interface
**Goal**: Implement the host's ability to manage the game and push numbers.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: AUTH-01, HOST-01, HOST-02, HOST-03
**Success Criteria** (what must be TRUE):
  1. User can access `/host` and input numbers 1–90.
  2. System rejects input if a number has already been drawn in the current round.
  3. Host can click a "Reset" button which clears the game state on the server.
**Plans**: TBD
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
| 1. Foundation & Communication | 1/2 | In Progress|  |
| 2. Host Control Interface | 0/0 | Not started | - |
| 3. Visual Bingo Display | 0/0 | Not started | - |
| 4. Resilience & UX Polish | 0/0 | Not started | - |
