# Tech Stack (Option A: PWA)

## Frontend
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- PWA support:
  - Web App Manifest
  - Service Worker (offline caching)
- Animations:
  - Framer Motion (recommended)
  - Lottie for confetti/celebrations (optional)

## State & Data
MVP:
- Local-first storage:
  - IndexedDB (recommended) via `idb` or `dexie`
  - fallback: localStorage

Phase 2:
- Supabase
  - Postgres DB
  - Auth
  - Row Level Security

## Hosting
- Vercel (frontend)
- Supabase (backend)

## Notifications
- PWA Web Push (Phase 2) OR
- Local reminders UX (store reminder time; show prompt + instructions)

## Quality
- ESLint + Prettier
- Zod for runtime validation
- Playwright for E2E testing (optional but good)
