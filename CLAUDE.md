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
npm run verify:openapi   # Smoke-test OpenAPI spec + v1 routes
npm run mcp:dev          # Start MCP server (stdio) against SSA_API_URL
npm run mcp:sse          # Start MCP server (HTTP/SSE) on MCP_SSE_PORT
```

## External API & MCP

Versioned REST at `/api/v1/*`. Legacy `/api/*` aliases include `Deprecation: true` headers.

| Resource | Location |
|---|---|
| OpenAPI spec | `GET /api/openapi.json` |
| Swagger UI | `GET /api/docs` |
| Integrator docs | `docs/API.md`, `docs/AUTH.md`, `docs/MCP.md` |
| MCP server | `packages/ssa-mcp-server/` |

Auth: Firebase Bearer **or** `ssa_live_...` API key (`src/server/authMiddleware.ts`). RBAC in `src/server/rbac.ts`.

### API/MCP pitfalls (do not repeat)

- MCP tools are thin wrappers over REST — never expose Admin SDK, billing, or Firestore directly
- Never pass `GEMINI_API_KEY`, `STRIPE_SECRET_KEY`, or Firebase Admin creds to MCP env
- API keys stored in Firestore `api_keys/` — client SDK denied; Admin SDK only
- Teacher routes require `role === teacher` OR `teacher:*` scope — Firebase auth alone is insufficient
- Sync requires auth in `cloud`/`hybrid` mode; optional only in Pi LAN mode
- MCP SSE must run as long-lived process — not inside Vercel serverless
- OpenAPI spec generated from Zod schemas in `src/api/schemas/` — keep in sync with route handlers

## Architecture Overview

**Salone Stars Academy** is an offline-first, gamified LMS for Sierra Leonean primary schools. Three UI modes in one SPA: **Pupil Play**, **Teacher Pi**, and **Parent Home**.

### Server (`server.ts`)

Express API + static host. App factory in `src/server/app.ts`. Protected routes use multi-mode auth (`src/server/authMiddleware.ts`).

| Route | Auth | Purpose |
|---|---|---|
| `GET /api/v1/health` | None | Health check + deployment mode |
| `GET /api/v1/quests` | None | Quest catalog (ETag cached) |
| `POST /api/v1/sync` | Optional (required cloud) | LWW pupil merge |
| `GET /api/v1/teacher/students` | Teacher / `pupils:read` | Leaderboard + sync logs |
| `POST /api/v1/teacher/generate-quest` | Teacher + premium | Gemini AI (10/hr) |
| `POST /api/v1/keys` | Firebase auth | Create scoped API key |
| `GET /api/openapi.json` | None | OpenAPI 3.1 spec |
| `GET /api/docs` | None | Swagger UI |

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
- In-memory rate limiters (`Map`/`Set`) are per-process — bypassed at multi-instance scale; use Redis
- `fs.writeFileSync` in `localJsonAdapter` is Pi-offline only (single process); never call in cloud/hybrid mode
- `getQuests()` from Firestore must always include `.limit(200)` and a pagination cursor — no full collection scans
- Badge count in LWW merge must be capped at 32 before writing to Firestore (rules reject arrays > 32)
- SW cache version must embed `VITE_BUILD_HASH` — hardcoded `"v1"` causes stale cache on every deploy
- `localStorage` writes are silent on quota failure (Android) — always wrap in `try/catch` and evict LRU on `QuotaExceededError`

## Scalability Patterns (1M DAU baseline)

### Rate Limiting
Use Redis-backed rate limiter (Upstash / Vercel KV) — **never** an in-memory `Map`. Key pattern: `rate:{uid}:{action}`. Falls back to in-memory only when `REDIS_URL` is absent (Pi-offline mode). Export `createRedisRateLimiter()` from `src/server/rateLimiter.ts`.

### Token Verification Cache
Cache decoded Firebase tokens in Redis: key `token_cache:{sha256(token)}`, TTL 55 min. Module: `src/server/tokenCache.ts`. Eliminates per-request Firebase Auth network call on ~95% of authenticated traffic.

### Quest API Caching
`GET /api/quests` must return `Cache-Control: public, max-age=300, stale-while-revalidate=60` and an `ETag` (sha1 of JSON). Vercel Edge CDN absorbs read load. Daily path selection is client-side from this cached list — zero origin calls for path picks.

### Firestore Batch Writes
Never call `firestoreAdapter.syncPupil()` in a per-pupil loop. Use `db.batch()` for classroom syncs; max 500 ops per batch. Fail loudly (throw) if the batch rejects — do **not** swallow errors and return stale local data as success.

### Firestore Rule Cost
Assign `get(/databases/.../users/$(request.auth.uid)).data` to a local variable **once** per `match` block. Each `get()` is a billed Firestore read; calling `getUserProfile()` twice in the same rule doubles costs.

### Code Splitting
Feature chunks must be lazy-loaded via `React.lazy()`. Never add a static import for a feature module in `App.tsx` — always `const X = lazy(() => import('./features/...'))` wrapped in `<Suspense>`. Target: ≤ 150 KB gzipped initial chunk.

### Service Worker
SW cache name must embed `import.meta.env.VITE_BUILD_HASH` — never hardcode `"v1"`. Use Background Sync API (`tag: 'sync-pupil-progress'`) for failed `POST /api/sync`. Sync queue lives in IndexedDB key `ssa_sync_queue`.

### localStorage vs IndexedDB
- **localStorage**: active-session pupil profile and daily-path picks cache only (< 5 KB per child, needs synchronous read)
- **IndexedDB**: quest stats history, completed quest IDs, badge history — these grow unbounded and will silently fail Android quota limits in localStorage

### API Client Resilience
`apiFetch()` must include: 3 retries, exponential backoff (1s → 2s → 4s), 10s timeout, offline detection (`!navigator.onLine` → enqueue to `ssa_sync_queue`). On Sierra Leone 2G/3G, ~5–10% of requests fail transiently; zero-retry silently drops pupil progress.

### Animation Budget
Wrap infinite CSS animations (`desktop-flow-*`, `mobile-flow-*`) in `@media (prefers-reduced-motion: no-preference)`. Pause via `animation-play-state: paused` after 60s document inactivity (use `document.visibilitychange`). Background gradient loops are the largest battery drain on low-end devices.

## Configuration

Copy `.env.example` to `.env`. Firebase client reads `firebase-applet-config.json`. Server Admin SDK uses `FIREBASE_PROJECT_ID`.

## Design System

See `DESIGN_SYSTEM_REFERENCE.md`. Use `<GlassCard>` from `src/shared/ui/` for cards.

## Firestore Security

`firestore.rules` — client cannot self-upgrade subscription; pupils scoped by `teacherId` or `parentId`; `parent_notes` require premium parent role; `isValidId()` enforced on pupil IDs.

See `PRD.md` for Phase 5 Parent Home requirements (PA-01–PA-10, B-06–B-09).
