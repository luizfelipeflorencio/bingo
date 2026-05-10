# Feature Research

**Domain:** Real-time Bingo display/management system (90-ball, supplementing physical cards)
**Researched:** 2026-05-10
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Prominent current-number display | The single job of a caller board — if the big number isn't obvious at a glance across a hall, the tool fails its core purpose | LOW | Extra-large typography, fills the viewport; drives 90% of user value |
| Full 1–90 number grid with called-state highlighting | Players cross-reference their physical cards; they need to visually scan all drawn numbers at once | LOW | Grid cells toggle "called" state; distinct colour for already-called vs uncalled |
| Recent-call history (last N numbers) | Players who miss a single draw want to self-recover without pestering the host | LOW | Show last 5–10 numbers in sequence; can be a strip below the main number |
| Host-only number registration | Core access-control requirement; anyone can watch, only the operator enters numbers | LOW | Separate `/host` URL; no auth needed — URL secrecy is sufficient for in-person games |
| Prevent duplicate number entry | Entering the same number twice invalidates the game; the system must guard against host fat-fingers | LOW | Track drawn set server-side; reject or warn on re-submission |
| Real-time push to all participants | Zero-refresh experience is the entire value prop; polling is a non-starter | MEDIUM | WebSocket broadcast; server holds authoritative state |
| Session reset / new game | Hosts run multiple rounds; they need a clean-slate button | LOW | Propagates to all clients in real time; clears both server state and client LocalStorage |
| Page-refresh survival (state persistence) | A participant who refreshes mid-game must not see a blank board | LOW | LocalStorage on client; server re-sends full state on WS connect |
| Responsive layout (phone & tablet) | Venue-goers check their phones; the board may be a projector or a personal device | LOW | Single breakpoint: stacked layout below ~640 px |
| Works over public HTTPS | Games are played in venues with shared Wi-Fi; HTTP is blocked on most modern browsers for WS | LOW | Deploy behind HTTPS reverse proxy (Railway / Render / Fly.io) |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Called count + remaining count | "23 of 90 called" gives every player a sense of how close they are to a full house; heightens tension | LOW | Pure arithmetic from drawn set size; display in header/footer |
| Progress bar / visual fill | Visceral sense of game progress without reading numbers; works at a glance across the room | LOW | Depends on called count; simple CSS width calculation |
| Auto-call mode with adjustable speed | Removes the need for a human to click for every draw; useful for small/casual games | MEDIUM | Server-side timer emits random draw every N seconds; host can pause/resume; conflicts with physical-ball draws |
| Sound effects on new number | Auditory confirmation that a new number was called; reduces "what was that?" questions | LOW | Single click/chime; Web Audio API or `<audio>` element |
| Colour-coded number groups | 90-ball convention: numbers 1–9 yellow, 10–19 blue, etc.; familiar to UK/Brazil players | LOW | CSS class by group; no logic complexity; purely cosmetic but builds trust |
| QR code on host screen for joining | Eliminates the need to announce a URL verbally in a noisy venue | LOW | Generate QR from participant URL client-side (e.g. `qrcode.js`); show in a modal |
| Multiple concurrent rooms | Two games running in the same venue without interfering | MEDIUM | Room ID in URL; server routes WS connections by room; LocalStorage keyed by room |
| Fullscreen / presenter mode | Host projects the participant view on a big screen; browser chrome is distracting | LOW | `document.documentElement.requestFullscreen()`; single button |
| Dark mode / theming | Evening bingo halls are dimly lit; a high-contrast dark display is easier to read | LOW | CSS variables; two themes; preference stored in LocalStorage |
| Connection status indicator | Participants know if they have lost their WebSocket connection and are seeing stale data | LOW | Green/red dot; reconnect logic; prevents silent data-loss from Wi-Fi drops |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Digital Bingo cards for participants | "Why can't I mark numbers on my phone?" | Completely changes the product scope — requires card generation, mark-tracking, winner detection, and per-player state; doubles or triples development effort for v1; also breaks the physical-card social dynamic | Explicitly out of scope for v1; physical cards are a feature, not a limitation |
| Automatic winner detection | "Tell me when someone wins" | Requires server knowing every player's card — impossible without digital cards; false win detection destroys game trust | Host verbally verifies a called "Bingo!" against the physical card; winner check is a social, not technical, problem |
| User accounts / login | "Save my history" or "track my wins" | Adds auth flow, password reset, session management, database — enormous complexity for zero game-play value in v1 | URL-based access control is sufficient; host URL is the secret |
| Voice / text-to-speech number calling | "Read out the number automatically" | Speech synthesis is locale-specific and quirky (British Bingo rhyming slang vs Portuguese vs US English); accessibility benefit is real but edge-case for this deployment target | Play a short chime sound instead; host reads the number verbally as they do with physical balls |
| Game history / statistics across sessions | "Who has the best record?" | Requires persistent storage (database), session identity, and a history UI — heavyweight for a display board | Server state resets on restart by design; LocalStorage handles single-session recovery |
| Admin dashboard / multi-game management | "Manage all my rooms from one place" | Management UI, auth, room CRUD — a full second product; distraction from core display quality | Multiple rooms via URL parameters is sufficient; room management is out of scope |
| 75-ball / custom grid variants | "We play American-style bingo" | Different number ranges and column rules require variant-aware logic throughout; tests the same core feature set with double the surface area | 90-ball only for v1; variant support is a clean extension point post-launch |

## Feature Dependencies

```
[WebSocket real-time push]
    └──required by──> [Participant display board]
    └──required by──> [Reset propagation]
    └──required by──> [Connection status indicator]

[Server authoritative state]
    └──required by──> [WebSocket real-time push]
    └──required by──> [Duplicate number prevention]
    └──required by──> [Multiple concurrent rooms]

[LocalStorage persistence]
    └──required by──> [Page-refresh survival]
    └──enhances──>    [Dark mode preference]

[Called count]
    └──required by──> [Progress bar]
    └──required by──> [Auto-call mode] (needs remaining pool)

[Full number grid]
    └──enhances──>    [Called count]
    └──enhances──>    [Colour-coded number groups]

[Host number registration]
    └──required by──> [Duplicate number prevention]
    └──required by──> [Auto-call mode] (same registration path, automated trigger)

[Multiple concurrent rooms]
    └──requires──>    [Room ID routing in server]
    └──requires──>    [LocalStorage keyed by room]

[Auto-call mode]
    └──conflicts──>   [Physical-ball draw workflow] (auto-call assumes no physical ball machine)
```

### Dependency Notes

- **WebSocket push requires server authoritative state:** The server must hold the full drawn-number list so new joiners get a state replay on connect; LocalStorage alone cannot serve new connections.
- **Progress bar requires called count:** Trivially derived — no independent complexity, but must be wired to the same state update event.
- **Auto-call conflicts with physical-ball workflow:** This system is designed around a human picking physical balls; auto-call is a mode for games without physical equipment. Don't conflate the two paths in the UX.
- **Multiple rooms requires room-keyed LocalStorage:** If two tabs are open in different rooms, a shared LocalStorage key would corrupt state. Key by room ID.
- **Duplicate prevention requires server validation:** Client-side duplicate checking is not sufficient — two hosts in the same room (e.g. host on two devices) could race. Server must be the authority.

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [x] **Prominent current-number display** — the entire reason the product exists
- [x] **Full 1–90 grid with called-state highlighting** — replaces looking at a physical board
- [x] **Recent call history strip** — self-service recovery for missed calls
- [x] **Host number registration (1–90, `/host` URL)** — the only input mechanism
- [x] **Duplicate number prevention** — correctness guarantee; without it the game is invalid
- [x] **WebSocket real-time push to all participants** — the core technical value prop
- [x] **Session reset with real-time propagation** — hosts always run multiple rounds
- [x] **LocalStorage page-refresh survival** — participants refresh; the board must persist
- [x] **Responsive layout (mobile + desktop)** — venue setting demands phone compatibility
- [x] **HTTPS / WSS deployment** — non-negotiable for public internet

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Called count + remaining count** — add when first users ask "how far along are we?"
- [ ] **Progress bar** — add alongside called count; trivially derived
- [ ] **Connection status indicator** — add when Wi-Fi drop complaints surface at first event
- [ ] **Sound effect on new number** — add after first live test shows silent boards lose attention
- [ ] **QR code for joining** — add when hosts report difficulty getting participants to the URL
- [ ] **Fullscreen / presenter mode** — add when projector use case is confirmed
- [ ] **Colour-coded number groups** — add if UK/Brazil players expect the traditional colour convention

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Multiple concurrent rooms** — defer until a single venue hosts multiple simultaneous games; requires room-routing architecture change
- [ ] **Auto-call mode** — defer; conflicts with the physical-ball workflow this product is built around; revisit only if a non-physical use case emerges
- [ ] **Dark mode / theming** — defer; nice polish but no functional impact on core use case
- [ ] **75-ball variant** — defer; clean extension point, but 90-ball must be rock-solid first

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Prominent current-number display | HIGH | LOW | P1 |
| Full 1–90 grid with called highlighting | HIGH | LOW | P1 |
| WebSocket real-time push | HIGH | MEDIUM | P1 |
| Host number registration | HIGH | LOW | P1 |
| Duplicate number prevention | HIGH | LOW | P1 |
| Session reset + propagation | HIGH | LOW | P1 |
| LocalStorage page-refresh survival | HIGH | LOW | P1 |
| Responsive layout | HIGH | LOW | P1 |
| HTTPS/WSS deployment | HIGH | LOW | P1 |
| Recent call history | MEDIUM | LOW | P1 |
| Called count + remaining | MEDIUM | LOW | P2 |
| Progress bar | MEDIUM | LOW | P2 |
| Connection status indicator | MEDIUM | LOW | P2 |
| Sound effect on new number | MEDIUM | LOW | P2 |
| QR code for joining | MEDIUM | LOW | P2 |
| Fullscreen / presenter mode | MEDIUM | LOW | P2 |
| Colour-coded number groups | LOW | LOW | P2 |
| Multiple concurrent rooms | MEDIUM | MEDIUM | P3 |
| Dark mode / theming | LOW | LOW | P3 |
| Auto-call mode | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | bingo90.netlify.app | bingocaller.com (75-ball) | Our Approach |
|---------|---------------------|---------------------------|--------------|
| Current number display | Large, prominent | Large, prominent | Same — table stakes |
| Full number grid | 90-number grid, highlights called | 5-col BINGO grid, highlights called | 90-number grid, called highlighted |
| Call history | Full list + TXT/CSV export | Scrollable list | Strip of last N + full grid serves as history |
| Participant view | Separate room code | Same URL, display-only | Separate `/view` URL (no room code needed for single-room v1) |
| Auto-call with speed control | Yes (2/3/5/10 sec) | No | Anti-feature for v1 (physical-ball workflow) |
| Sound / voice | Sound effects + voice | Not mentioned | Sound effect only (no voice for v1) |
| Reset / new game | New game button | Restart button | Reset button, broadcasts to all clients |
| Multiple themes | 4 themes (Classic/Neon/Golden/Casino) | No | Single clean theme for v1 |
| Host vs participant auth | Room code | None | URL-based (`/host` vs `/view`) |
| Real-time WebSocket sync | Room code-based | No (single-player) | WebSocket broadcast, server-authoritative |
| LocalStorage persistence | Not mentioned | Not mentioned | Explicit requirement — full state replay on join/refresh |
| QR code | Not mentioned | Not mentioned | v1.x differentiator |
| Progress bar | Not mentioned | Not mentioned | v1.x, derived from called count |
| Connection status indicator | Not mentioned | Not mentioned | v1.x differentiator |

## Sources

- [bingo90.netlify.app](https://bingo90.netlify.app/) — 90-ball bingo caller; feature-complete reference for number display, auto-call, room codes, themes
- [bingocaller.com](https://www.bingocaller.com/) — 75-ball caller; current/previous call display, full grid, history, restart controls
- [bingobaker.com](https://bingobaker.com/) — card generation + virtual play; host/participant URL model, call list
- [heybingo.com](https://www.heybingo.com/) — multiplayer bingo platform; 90-ball format, chat rooms, player profiles
- Project context: `.planning/PROJECT.md` — system constraints, out-of-scope decisions, deployment target

---
*Feature research for: Real-time Bingo display/management system (90-ball)*
*Researched: 2026-05-10*
