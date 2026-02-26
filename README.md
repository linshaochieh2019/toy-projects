# Toy Projects

This repo contains two local-first toy web apps:

- `mini-task-board/` — simple task board MVP
- `poker-tracker-lite/` — poker session tracker with trend charts

## Quick Start

Clone the repo:

```bash
git clone https://github.com/linshaochieh2019/toy-projects.git
cd toy-projects
```

## Run mini-task-board

```bash
cd mini-task-board
python3 -m http.server 8080
# open http://localhost:8080
```

## Run poker-tracker-lite

```bash
cd poker-tracker-lite
python3 -m http.server 8081
# open http://localhost:8081
```

## Notes

- Both projects are static front-end apps (no backend required).
- Data is stored locally in browser storage.
- For detailed usage and scope notes, see each project's `README.md`.
