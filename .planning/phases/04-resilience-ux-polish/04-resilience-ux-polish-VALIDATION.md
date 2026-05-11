# Phase 4 Validation: Resilience & UX Polish

## Automated Tests

### Persistence (D-01, SYNC-02)
- [ ] **State Restoration**: Start server, draw a number, restart server, verify state persists in `gameState.json` and client `SYNC`.
- [ ] **Atomic Rename**: Verify that `gameState.json` is not corrupted during rapid writes (simulate crash/kill).
- [ ] **Throttling**: Verify that rapid draws do not cause excessive disk writes (check write frequency).

### UX Polish (D-03, D-04)
- [ ] **Safe Areas**: Verify `env(safe-area-inset-*)` exists in `style.css`.
- [ ] **Touch Targets**: Verify `min-height: 44px` or similar for host buttons in `style.css`.
- [ ] **Responsive Grid**: Verify 10-column layout remains usable at mobile widths via CSS breakpoints.

## Manual Verification

### Host Experience
- [ ] Open host on mobile; verify number pad is large enough for thumbs.
- [ ] Rotate host screen; verify grid adjusts without layout break.

### Participant Experience
- [ ] Open participant on mobile; verify "Top Heavy" layout scales proportionally.
- [ ] Refresh page during a game; verify highlights persist (LocalStorage + SYNC).

## Verification Scripts

```bash
# Verify persistence logic in server.js
grep -q "gameState.json" server.js && grep -q "rename" server.js

# Verify mobile CSS in style.css
grep -q "safe-area-inset" public/style.css && grep -q "min-height: 44px" public/style.css

# Verify dependency
grep -q "lodash.throttle" package.json
```
