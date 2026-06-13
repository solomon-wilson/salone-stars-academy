# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server (Express + Vite HMR on port 3000)
npm run build            # Build frontend (Vite) + bundle server.ts → dist/server.cjs
npm run start            # Run production server from dist/
npm run lint             # TypeScript type-check only (tsc --noEmit)
npm run clean            # Remove dist/ and server.js
npm run verify:sync      # Verify sync API + LWW merge (server must be running)
npm run verify:publish   # Verify quest publish validation
npm run verify:parent    # Verify parent sync + protected homework API
```

## Architecture Overview

**Salone Stars Academy** is an offline-first, gamified LMS for Sierra Leonean primary schools. Three UI modes in one SPA: **Pupil Play**, **Teacher Pi**, and **Parent Home**.

### Server (`server.ts`)

Express API + static host. Protected routes use Firebase ID token via `requireAuth` middleware (`src/server/authMiddleware.ts`).

| Route | Auth | Purpose |
|---|---|---|
| `GET /health` | None | Health check + deployment mode |
| `GET /api/quests` | None | Quest catalog |
| `POST /api/sync` | Optional | LWW pupil merge (supports `parentId`) |
| `GET /api/teacher/students` | Required | Leaderboard + sync logs |
| `POST /api/teacher/generate-quest` | Required | Gemini AI (rate-limited 10/hr) |
| `POST /api/teacher/publish-quest` | Required | Publish quest (needs subject + class_level) |
| `POST /api/parent/generate-homework` | Required | Gemini homework draft (5/day/parent) |
| `POST /api/parent/publish-homework` | Required | Parent-approved homework quest |
| `POST /api/billing/checkout` | Required | Stripe Checkout (`subscriberRole: parent\|teacher`) |
| `GET /api/billing/success` | None | Redirect handler → updates Firestore subscription |
| `POST /api/billing/webhook` | Stripe sig | Webhook for checkout.session.completed |

### Data Layer — DataPort Adapters

`DatabaseManager` delegates to a `DataPort` interface (`src/data/ports.ts`):

- **`LocalJsonAdapter`** — `classroom_db.json` (Pi offline)
- **`HybridDataAdapter`** — local JSON + Firestore sync when `DEPLOYMENT_MODE=cloud|hybrid`

Seed data lives in `src/dbManagerCore.ts`. Server types duplicate frontend types intentionally (esbuild bundle constraint).

### Billing

- Checkout sends `{ userId, planName, email, subscriberRole }` — NOT `plan` / `userEmail`
- Individual $19.99 is dual-audience: **parent** (home tutor replacement) and **teacher** (private lesson toolkit)
- `subscriptionPlan` is updated via Firebase Admin SDK only (webhook + success redirect)
- Never call client `updateProfile({ subscriptionPlan })` — Firestore rules block it

### Frontend Structure

```
src/
  App.tsx                    # Main shell + tab orchestration
  features/pupil-play/       # BadgesCabinet, SyncConsole, hooks
  features/teacher-pi/         # Teacher auth form
  features/parent-home/        # Parent auth, child linking, digest, daily path
  features/billing/          # Role-aware pricing modal
  shared/ui/                 # GlassCard, AppBackground, ErrorBoundary
  lib/                       # api-client, tts, subject-colors, daily-path
  firebaseDb.ts              # Client Firestore CRUD (profiles, pupils, parent_notes)
```

Use `apiFetch()` from `src/lib/api-client.ts` for authenticated API calls.

### Pitfalls (do not repeat)

- Quest publish must include `subject` and `class_level` from AI form fields
- No demo credential bypass or client-side premium simulation
- CORS in production uses `APP_URL`, not `*`
- Parent Individual plan: max 3 linked children (`MAX_PARENT_CHILDREN` in `src/constants/parent.ts`)
- Home pupils use `parentId` on Firestore pupil docs; sync passes `parentId` in `/api/sync` body
- Curriculum upload remains **teacher-only**; parents use daily path + AI homework instead

## Configuration

Copy `.env.example` to `.env`. Firebase client reads `firebase-applet-config.json`. Server Admin SDK uses `FIREBASE_PROJECT_ID`.

## Design System

See `DESIGN_SYSTEM_REFERENCE.md`. Use `<GlassCard>` from `src/shared/ui/` for cards.

## Firestore Security

`firestore.rules` — client cannot self-upgrade subscription; pupils scoped by `teacherId` or `parentId`; `parent_notes` require premium parent role; `isValidId()` enforced on pupil IDs.

See `PRD.md` for Phase 5 Parent Home requirements (PA-01–PA-10, B-06–B-09).
