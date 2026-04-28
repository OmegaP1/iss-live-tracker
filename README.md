# ISS Live Tracker

Real-time ISS telemetry — position, crew, orbital mechanics, day/night cycle, observer pass prediction, and more. Next.js 14 (App Router) + Tailwind, deployable to Vercel without a database.

## Stack

- Next.js 14 (App Router) + React 18 + TypeScript
- Tailwind CSS (with CSS variables for the design tokens)
- Leaflet 1.9 for the map (CARTO dark tiles)
- Inter + JetBrains Mono via `next/font`

## Data sources

- `https://api.wheretheiss.at/v1/satellites/25544` — live position (HTTPS, polled every 5s)
- `http://api.open-notify.org/astros.json` — current crew. Proxied through `/api/crew` because it's HTTP-only; falls back to a cached roster if the upstream is unreachable.
- `https://nominatim.openstreetmap.org/reverse` — reverse geocoding for the ISS sub-point (rate-limited to 15 s; ocean fallback by lat/lon).

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000>.

## Deploy on Vercel

Push to GitHub, import the repo into Vercel, accept the defaults. No env vars required.

## Layout

- `app/` — route, layout, global CSS, `/api/crew` proxy
- `components/` — `Tracker`, `Map` (dynamic, client-only), and 16 sidebar panels
- `lib/` — pure helpers (`utils.ts`), live data hooks (`hooks.ts`), and reference data (`data.ts`)
