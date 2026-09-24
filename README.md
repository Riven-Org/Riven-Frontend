# Riven Frontend

The Riven dashboard: React + Vite + TypeScript.
The API and verification pipeline live in [Riven-Backend](https://github.com/Riven-Org/Riven-Backend).

## Prerequisites

- Node.js 22 and npm
- Riven-Backend running locally (`make api` in that repo) for live data

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
```

During development, requests to `/api/*` are forwarded to the backend at
`http://localhost:8000` (see `vite.config.ts`). The start page shows
**API: up** when the backend is reachable.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run lint` | oxlint |
| `npm run build` | Type check + production build |
| `npm run preview` | Serve the production build |

## Working on a ticket

1. Branch from `main`: `git checkout -b S10.1-design-system`
2. Make the change; run `npm run lint && npm run build`.
3. Open a PR and put the ClickUp ticket ID in the description.
