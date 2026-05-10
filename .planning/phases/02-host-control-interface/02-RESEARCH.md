# Phase 2: Host Control Interface - Research

**Researched:** 2026-05-10
**Domain:** Real-time web authorization & responsive UI controls
**Confidence:** HIGH

## Summary

This phase focuses on enabling the game host to manage the Bingo state through a secure interface. Key technical challenges include authenticating WebSocket connections from the host and creating a dense but usable 1-90 number grid for mobile devices. 

**Primary recommendation:** Use Socket.io 4's `auth` handshake option for centralized middleware-based authentication, and CSS Grid with `auto-fit` for a zero-media-query responsive button pad.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Authenticate host actions via a secret key passed in the URL (e.g., `/host?key=...`).
- **D-02:** The client must send this key during the WebSocket handshake or as part of host-only event payloads for server-side validation.
- **D-03:** Host registers numbers via a full 1–90 button grid (tap to draw).
- **D-04:** Server must prevent duplicates and validate that the number is within the 1–90 range.
- **D-05:** 'Reset Game' action must be protected by a confirmation dialog to prevent accidental wipes.
- **D-06:** Reset action clears the authoritative server state and propagates the clear to all clients in real time.
- **D-07:** Unified View: The host interface should show the same board/grid as participants, with additional overlay controls for number selection and resetting.

### Claude's Discretion
- Specific styling of the 1–90 grid and the layout of the host controls.
- The format and generation logic for the host secret key (likely a UUID or similar).

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | Host access via dedicated `/host` URL with token-based validation. | Socket.io 4 `auth` handshake and middleware findings. |
| HOST-01 | Host can register drawn numbers (1–90) via a simple number pad. | CSS Grid responsive layout patterns for 1-90 grid. |
| HOST-02 | System prevents duplicate numbers or invalid ranges. | Server-side validation logic patterns for atomic state updates. |
| HOST-03 | Host can reset the current game state to start a new round. | Real-time broadcast patterns for global state resets. |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Host Authentication | API / Backend | Browser | Server must be source of truth for secrets; client provides the token. |
| Number Validation | API / Backend | — | Prevent state corruption from malicious/buggy clients. |
| Game State Reset | API / Backend | — | Authoritative wipe of in-memory state. |
| Number Pad UI | Browser | — | Local UI interaction and visual feedback. |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | 5.2.1 | Web server | Latest stable Express version. |
| socket.io | 4.8.3 | Real-time transport | Standard for Node.js real-time apps. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|--------------|
| dotenv | 17.4.2 | Environment management | Storing the secret host key securely. |

**Version verification:**
- `express@5.2.1` (Verified via npm view, 2026-05-10)
- `socket.io@4.8.3` (Verified via npm view, 2026-05-10)

## Architecture Patterns

### Recommended Project Structure
```
public/
├── host.html        # Specialized host interface
├── host.js          # Host-specific client logic
├── app.js           # Shared participant/viewer logic
server.js            # Unified backend logic
```

### Pattern 1: Socket.io 4 Middleware Authentication
**What:** Centralized validation during the handshake phase.
**When to use:** AUTH-01 enforcement.
**Example:**
```javascript
// Source: https://socket.io/docs/v4/middlewares/
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (token === process.env.HOST_KEY) {
    socket.isHost = true;
    return next();
  }
  // Allow non-host connections (participants)
  socket.isHost = false;
  next();
});
```

### Pattern 2: Responsive 1-90 Grid
**What:** Using CSS Grid `auto-fill` or `auto-fit` with `minmax`.
**When to use:** HOST-01 (1-90 button pad).
**Example:**
```css
/* Source: https://css-tricks.com/look-ma-no-media-queries-responsive-layouts-using-css-grid/ */
.number-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(45px, 1fr));
  gap: 8px;
  padding: 10px;
}
```

### Anti-Patterns to Avoid
- **Event-level validation only:** Checking `if (key === ...)` inside every `socket.on` handler is repetitive and error-prone. Use middleware to set a `socket.isHost` flag once.
- **Client-side range checks only:** Never trust the client to only send 1-90; the server must validate the integer range and check `drawnNumbers.includes(num)`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token Verification | Custom regex/string manipulation | Simple equality with `process.env` | For v1 MVP, a static secret key is sufficient and safer than custom crypto. |
| Responsive Grid | Float/Clear or complex Media Queries | CSS Grid | Modern, robust, and significantly less code. |

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Runtime | ✓ | 20.x+ | — |
| npm | Pkg Mgmt | ✓ | 10.x+ | — |
| express | Web Server | ✓ | 5.2.1 | — |
| socket.io | Real-time | ✓ | 4.8.3 | — |

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected |
| Config file | N/A |
| Quick run command | `node server.js` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| AUTH-01 | Host URL with key allows control | Manual | `curl http://localhost:3000/host?key=...` | ❌ Wave 0 |
| HOST-02 | Reject duplicates | Integration | (Logic check in server.js) | ✅ |

### Wave 0 Gaps
- [ ] No automated test framework (e.g., Jest/Supertest). Recommendation: Add `npm install --save-dev jest supertest` to verify API and socket behavior.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | URL-based secret key (D-01) |
| V4 Access Control | yes | Server-side `isHost` check for privileged events |
| V5 Input Validation | yes | Strict `[1..90]` integer range check |

### Known Threat Patterns for Node.js/Socket.io

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Unauthorized reset | Spoofing | Middleware-based token verification |
| Duplicate draw injection | Tampering | Server-side state check before push |

## Sources

### Primary (HIGH confidence)
- [socket.io-v4-middlewares](https://socket.io/docs/v4/middlewares/) - Handshake `auth` and middleware registration.
- [css-grid-responsive](https://css-tricks.com/look-ma-no-media-queries-responsive-layouts-using-css-grid/) - Responsive patterns for grids.

### Secondary (MEDIUM confidence)
- WebSearch for mobile-friendly button sizing in large grids.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Static secret key is sufficient | Don't Hand-Roll | Low - easily upgraded to dynamic keys if needed. |
| A2 | No DB needed | Summary | Low - in-memory is fine for MVP. |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using latest stable versions.
- Architecture: HIGH - Socket.io middleware is the industry standard for this.
- Pitfalls: MEDIUM - UI performance for 90 buttons on ultra-low-end mobile needs watching.

**Research date:** 2026-05-10
**Valid until:** 2026-06-10
