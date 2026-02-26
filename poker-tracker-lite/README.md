# Poker Tracker Lite (MVP)

Mobile-first, local web app to track poker sessions (cash + tournament), calculate profit/loss, and view lightweight analytics.

## Features

- Log sessions with fields:
  - Date
  - Location
  - Stake/Blinds label
  - Buy-in
  - Cash-out/Payout
  - Session type (Cash or Tournament)
  - Optional notes
- Auto profit/loss per session (`cashOut - buyIn`)
- Session history list with delete
- Filter by session type: **All / Cash / Tournament**
- Summary windows based on filtered sessions:
  - All filtered sessions
  - Recent 7 sessions
  - Recent 30 sessions
- Charts:
  - Profit per session over time
  - Cumulative bankroll over time
  - Profit by stake
- Local persistence via `localStorage` (no backend)

## Data resilience

- Stored sessions are validated on load. If `localStorage` contains invalid JSON or a non-array payload, the app safely falls back to an empty list instead of crashing.
- Each loaded session is sanitized to safe types/defaults (including numeric coercion for buy-in/cash-out), and profit is recalculated from sanitized values.
- HTML escaping now safely handles `null`, `undefined`, and non-string values.

## Tech Stack

- Vanilla HTML/CSS/JS
- Chart.js via CDN

## Run Locally

### Option 1: Open directly
Open `index.html` in your browser.

### Option 2: Serve with a local static server (recommended)

```bash
cd /Users/pinchylin/.openclaw/workspace/poker-tracker-lite
python3 -m http.server 8080
```

Then open: `http://localhost:8080`

## Project Files

- `index.html` – UI markup
- `styles.css` – mobile-first styling
- `app.js` – app logic + charts + persistence
- `README.md` – setup and usage

## Notes / Known Gaps

- No authentication or cloud sync (single-browser local storage only)
- No edit-in-place for existing sessions (delete + re-add as workaround)
- No advanced metrics (hourly rate, variance, BB/100, ITM%) in this MVP
- No import/export CSV yet
