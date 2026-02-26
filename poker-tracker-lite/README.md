# Poker Tracker Lite

Mobile-first, local web app to track poker sessions (cash + tournament), calculate profit/loss, and view lightweight analytics.

## Features

### Session logging
- **Quick Add (mobile-first default):** date, type, buy-in, cash-out up front
- **Optional details** in collapsible section: location, stake label, notes
- Auto profit/loss per session (`cashOut - buyIn`)
- Sticky bottom **Save Session** CTA on mobile
- Edit existing sessions from history (not just delete)

### History, filters, analytics
- Session history list with edit + delete
- Filter by session type: **All / Cash / Tournament**
- Summary windows based on filtered sessions:
  - All filtered sessions
  - Recent 7 sessions
  - Recent 30 sessions
- Charts:
  - Profit per session over time
  - Cumulative bankroll over time
  - Profit by stake

### PWA + offline behavior
- Web app manifest (`manifest.webmanifest`)
- Service worker (`sw.js`) for shell/resource caching
- Install prompt handling (`beforeinstallprompt`) with an **Install App** button
- Offline banner + offline navigation fallback after first load
- Local persistence via `localStorage` (no backend)

## Data resilience

- Stored sessions are validated on load. If `localStorage` contains invalid JSON or a non-array payload, the app safely falls back to an empty list instead of crashing.
- Each loaded session is sanitized to safe types/defaults (including numeric coercion for buy-in/cash-out), and profit is recalculated from sanitized values.
- HTML escaping safely handles `null`, `undefined`, and non-string values.

## Tech Stack

- Vanilla HTML/CSS/JS
- Chart.js via CDN
- PWA basics: manifest + service worker

## Run Locally

> For service worker + install behavior, use a local server (not `file://`).

```bash
cd /Users/pinchylin/.openclaw/workspace/poker-tracker-lite
python3 -m http.server 8080
```

Then open: `http://localhost:8080`

## Project Files

- `index.html` – UI markup + PWA hooks
- `styles.css` – mobile-first styling, sticky CTA, touch-target updates
- `app.js` – app logic, edit flow, charts, persistence, PWA/install handling
- `manifest.webmanifest` – install metadata
- `sw.js` – cache + offline fallback behavior
- `icons/icon-192.svg` – app icon
- `icons/icon-512.svg` – app icon

## Known Gaps

- No authentication or cloud sync (single-browser local storage only)
- No import/export CSV yet
- No advanced poker metrics (hourly rate, variance, BB/100, ITM%)
- Chart.js CDN dependency may require first online load before fully offline chart rendering
