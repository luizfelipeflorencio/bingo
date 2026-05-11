# Validation: Phase 01-foundation

## Strategy

Phase 01-foundation focuses on the real-time link. Verification will be a mix of automated smoke tests for the server/assets and manual verification for the multi-tab synchronization and reconnection logic.

## Automated Verification

| Component | Target | Test Type | Command |
|-----------|--------|-----------|---------|
| Server | `server.js` | Startup | `node --check server.js` |
| Server | `server.js` | Health | `node server.js & sleep 2 && curl -f http://localhost:3000 && pkill -f server.js` |
| Client | `public/index.html` | Asset | `grep "socket.io.js" public/index.html` |
| Client | `public/app.js` | Syntax | `node --check public/js/app.js` (if applicable) |

## Manual Verification (Gated)

### 1. Initial Connection
- **Action**: Open `http://localhost:3000`.
- **Success**: UI shows "Status: Connected".
- **Evidence**: Network tab shows successful 101 Switching Protocols.

### 2. Live Update Push
- **Action**: Use a temporary server-side loop to push `numberDrawn`.
- **Success**: Numbers appear in the participant view instantly.

### 3. State Synchronization (Late Joiner)
- **Action**: Start server, wait for 3 numbers to be "drawn", then open a second tab.
- **Success**: Second tab immediately shows the same 3 numbers as the first.

### 4. Resilience (Reconnection)
- **Action**: Kill the server process, wait 5 seconds, restart server.
- **Success**: Clients transition to "Disconnected" and then back to "Connected" without manual refresh.

## Requirement Coverage

| ID | Requirement | Method |
|----|-------------|--------|
| AUTH-02 | Participant access via public `/` | Automated Health Check |
| DISP-04 | Real-time updates via Socket.io | Manual Live Update Push |
| SYNC-01 | New participants receive current game state | Manual State Synchronization |
| SYNC-03 | Server state unconditionally overwrites client cache | Manual Resilience Test |
