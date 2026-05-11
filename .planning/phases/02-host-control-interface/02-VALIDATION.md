# Validation: Phase 02-host-control-interface

## Strategy

Phase 02 focuses on the host control interface and secure number registration. Verification involves automated tests for the server-side validation logic and manual verification for the host UI and end-to-end flow.

## Automated Verification

| Component | Target | Test Type | Command |
|-----------|--------|-----------|---------|
| Server | `server.js` | Handshake Auth | `node -e "const io = require('socket.io-client'); const s = io('http://localhost:3000', { auth: { token: 'invalid' } }); s.on('connect', () => { console.log('FAIL: Connected with invalid token'); process.exit(1); }); setTimeout(() => process.exit(0), 2000);"` |
| Server | `server.js` | Logic Validation | `node tests/phase2-logic.test.js` (to be created) |
| Client | `public/host.html` | Asset | `grep "host.js" public/host.html` |

## Manual Verification (Gated)

### 1. Host Authentication
- **Action**: Access `http://localhost:3000/host` without a key.
- **Success**: Connection is refused or marked as non-host.
- **Action**: Access `http://localhost:3000/host?key=bingo-secret-123`.
- **Success**: Connection is accepted and UI shows "Authenticated as Host".

### 2. Number Registration
- **Action**: Click a number button on the host grid.
- **Success**: Number is highlighted on host grid AND appears on participant view in real-time.

### 3. Duplicate Prevention
- **Action**: Attempt to click the same number button twice.
- **Success**: Server ignores the second request; UI does not change.

### 4. Game Reset
- **Action**: Click "Reset Game" button.
- **Success**: Confirmation dialog appears. On "OK", all numbers are cleared from host and participant views.

## Requirement Coverage

| ID | Requirement | Method |
|----|-------------|--------|
| AUTH-01 | Host access via dedicated `/host` URL | Manual Auth Test |
| HOST-01 | Host can register drawn numbers (1–90) | Manual Registration Test |
| HOST-02 | System prevents duplicates/invalid ranges | Automated Logic Test |
| HOST-03 | Host can reset the current game state | Manual Reset Test |
