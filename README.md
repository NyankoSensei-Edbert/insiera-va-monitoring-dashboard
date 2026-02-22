# INSIERA-VA Monitoring Dashboard

React + Vite frontend with a Python Flask API proxy. All state persists across page reloads via `localStorage`.

## Stack

| Layer    | Tech              |
|----------|-------------------|
| Frontend | React 18 + Vite   |
| Proxy    | Python Flask      |
| Container| Docker / Compose  |

---

## Quick start (Docker — recommended)

```bash
# 1. Set your backend URL in docker-compose.yml (BACKEND_URL)
# 2. Build and run
docker compose up --build

# Open
http://localhost:5050
```

---

## Quick start (local dev)

```bash
# Install JS deps
npm install

# Start Vite dev server (hot reload, proxy built-in via vite.config.js)
npm run dev
# → http://localhost:3000
```

> In dev mode Vite itself proxies `/api` to `BACKEND_URL` — no Python needed.

---

## Production (without Docker)

```bash
# Build React
npm run build

# Install Python deps
pip install flask requests

# Run proxy (serves ./dist + proxies /api)
BACKEND_URL=https://your-server:8883 python server.py
# → http://localhost:5050
```

---

## Environment variables

| Variable      | Default                    | Description                          |
|---------------|----------------------------|--------------------------------------|
| `BACKEND_URL` | `https://localhost:8883`   | Real INSIERA-VA backend URL          |
| `VERIFY_SSL`  | `false`                    | Set to `true` for strict SSL         |
| `PORT`        | `5050`                     | Local port for Flask server          |

---

## What persists across reloads

All state is saved to `localStorage` and restored on page load:

- Active tab (Groups / Targets / Resend)
- Auth token (`X-Seclabid`)
- Groups filters (search, user, date range, page size)
- Groups sort column + direction
- Groups current page
- Which group rows are expanded
- Targets search + page
- Resend activity ID field
- Full resend history (last 50 entries)

---

## Project structure

```
insiera-monitoring/
├── src/
│   ├── components/
│   │   ├── GroupsPage.jsx      ← Groups tab (filters, sort, expand)
│   │   ├── TargetsPage.jsx     ← Targets tab
│   │   ├── ResendPage.jsx      ← Resend tab + history log
│   │   ├── ActivityCard.jsx    ← Activity card inside expanded group
│   │   ├── Badge.jsx           ← Status badge
│   │   ├── Pagination.jsx      ← Pagination with ellipsis
│   │   ├── StatCard.jsx        ← Animated stat card
│   │   ├── Spinner.jsx
│   │   └── ToastContainer.jsx
│   ├── hooks/
│   │   ├── useLocalStorage.js  ← Persist any state key
│   │   └── useToast.js
│   ├── lib/
│   │   ├── api.js              ← fetch wrapper → /api/*
│   │   └── utils.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── server.py                   ← Flask proxy + static file server
├── requirements.txt
├── Dockerfile                  ← Multi-stage: Node build → Python serve
├── docker-compose.yml
├── vite.config.js
└── package.json
```
