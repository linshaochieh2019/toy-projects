# Mini Task Board (MVP)

A tiny local web app for managing tasks.

## Features

- Create task
  - **Title required**
  - Due date optional
  - Priority: `low` / `med` / `high` (default `med`)
- List tasks
- Mark task done / open
- Filter tasks by: `all`, `open`, `done`
- Local persistence via browser `localStorage`

## Tech Stack

- Plain HTML/CSS/JavaScript (no framework)

## Run Locally

### Option A (recommended): Python static server

```bash
cd /Users/pinchylin/.openclaw/workspace/mini-task-board
python3 -m http.server 8000
```

Then open: <http://localhost:8000>

### Option B: Open file directly

Open `index.html` in your browser.

> Note: LocalStorage behavior is most consistent when served via HTTP (Option A).

## Project Files

- `index.html` – UI structure
- `styles.css` – styling
- `app.js` – app logic (state, filters, render, persistence)
- `QA_CHECKLIST.md` – short manual test checklist for Bloop

## Scope Notes

This is intentionally MVP-level and single-user local only.
