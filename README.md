# Salone Stars Academy

An offline-first, gamified LMS for Sierra Leonean primary schools (Classes 1–6), aligned to the MBSSE national curriculum.

## Run Locally

**Prerequisites:** Node.js 18+

1. Copy environment variables:
   ```bash
   cp .env.example .env
   ```
2. Fill in `GEMINI_API_KEY`, Firebase, and Stripe keys in `.env`
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
4. Open http://localhost:3000

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Express + Vite dev server on port 3000 |
| `npm run build` | Production build (Vite + server bundle) |
| `npm run start` | Run production server from `dist/` |
| `npm run lint` | TypeScript type-check |
| `npm run verify:sync` | Verify sync API + LWW merge |
| `npm run verify:publish` | Verify quest publish validation |

## Architecture

- **Pupil Play** — localStorage quiz state, sync to Teacher Pi via `/api/sync`
- **Teacher Pi** — Firebase Auth, Gemini quest generation, Stripe billing, curriculum upload
- **Data layer** — `DataPort` adapters: local JSON (`classroom_db.json`) + optional Firestore sync (`DEPLOYMENT_MODE=pi|cloud|hybrid`)
- **Security** — Firebase ID token auth on protected API routes; Firestore rules enforce premium gates

See [CLAUDE.md](CLAUDE.md) for full architecture details.

## Environment Variables

See [.env.example](.env.example). Key variables:

- `GEMINI_API_KEY` — AI quest generation
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — billing
- `FIREBASE_PROJECT_ID` — enables cloud/hybrid data sync
- `APP_URL` — production CORS origin

Firebase client config is in `firebase-applet-config.json`.
