# Authentication & Authorization

## Firebase ID tokens (user context)

Used by the SPA, teacher/parent flows, and MCP clients acting on behalf of a signed-in user.

```bash
curl -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  https://your-app.vercel.app/api/v1/teacher/students
```

The server loads the Firestore `users/{uid}` profile once per request (cached in Redis for 55 min) and attaches:

- `role`: `teacher` | `parent` | `pupil`
- `subscriptionPlan`: `free` | `individual` | `team`
- `scopes`: derived from role

### Token cache window

Firebase tokens are cached for 55 minutes in Redis. This means subscription downgrades (e.g., plan cancellation) may take up to 55 minutes to reflect on API responses. Revoked tokens remain valid until the cache TTL expires — design integrations to tolerate this window.

---

## API keys (machine-to-machine)

For LMS, SIS, and analytics integrations without a human login.

### Create a key

Requires Firebase auth — **not** another API key. This prevents key-from-key privilege escalation.

```bash
curl -X POST https://your-app.vercel.app/api/v1/keys \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Freetown Primary LMS",
    "scopes": ["quests:read", "pupils:read"],
    "rateLimitPerHour": 500,
    "expiresAt": "2027-01-01T00:00:00Z"
  }'
```

Response includes `secret` **once**. Store it immediately in a secret manager.

### Use a key

```bash
curl -H "Authorization: Bearer ssa_live_..." \
  https://your-app.vercel.app/api/v1/quests
```

Or:

```bash
curl -H "X-SSA-Api-Key: ssa_live_..." \
  https://your-app.vercel.app/api/v1/quests
```

### Per-key rate limits

Every API key record includes a `rateLimitPerHour` field (default 100). This is enforced server-side via Redis on every authenticated request. Requests that exceed the per-key limit receive 429 `RATE_LIMITED` with `X-RateLimit-*` headers.

Endpoint-specific limits (AI generation, Shola chat) apply additionally and are lower.

### Revoke a key

```bash
curl -X DELETE https://your-app.vercel.app/api/v1/keys/{keyId} \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"
```

Revocation is immediate — the key is marked inactive in Firestore and rejected on next use.

### Rotate a key

`POST /api/v1/keys/:keyId/rotate` atomically replaces a key in a single operation:

```bash
curl -X POST https://your-app.vercel.app/api/v1/keys/${OLD_KEY_ID}/rotate \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN"
```

The old key is revoked and a new key (same name/scopes/rate limit) is created in one Firestore batch. Prefer rotation over manual create-then-delete to eliminate the downtime window between the two steps.

**Recommended rotation cadence:** every 90 days, or immediately after any suspected compromise.

### Pupil-scoped keys

For integration keys that should only touch specific pupils, set `allowedPupilIds` at creation time:

```bash
curl -X POST https://your-app.vercel.app/api/v1/keys \
  -H "Authorization: Bearer $FIREBASE_ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Class 4A Sync Key",
    "scopes": ["pupils:write"],
    "allowedPupilIds": ["pupil-001", "pupil-002", "pupil-003"]
  }'
```

Sync requests for any pupil ID not in the list are rejected with `403 FORBIDDEN`. This is enforced server-side on both `POST /api/v1/sync` and `POST /api/v1/sync/batch`.

---

## Scope catalog

| Scope | Grants |
|-------|--------|
| `quests:read` | `GET /api/v1/quests`, `GET /api/v1/quests/:id` |
| `quests:write` | Publish quest/homework |
| `pupils:read` | Teacher students endpoint |
| `pupils:write` | Pupil sync (single + batch) |
| `ai:generate` | Gemini draft endpoints (generate-quest, generate-homework) |
| `invites:write` | Generate/link invites |
| `shola:chat` | Shola AI tutor chat |
| `teacher:*` | All teacher scopes |
| `parent:*` | All parent scopes |

**Principle of least privilege:** institutional keys should default to read-only scopes. AI generation scopes should only be granted to keys that genuinely need AI access.

---

## Role enforcement

| Route group | Required |
|-------------|----------|
| `/api/v1/teacher/*` | `role === teacher` OR `teacher:*` scope |
| `/api/v1/parent/*` | `role === parent` OR `parent:*` scope |
| AI generate routes | Premium plan + rate limit (Firebase auth alone is insufficient) |
| `/api/v1/sync` | Auth required in cloud/hybrid; optional in Pi LAN mode |
| `/api/v1/shola/chat` | Auth required (no anonymous access) |

---

## Security checklist for integrators

- [ ] Store API key secrets in a secret manager (never in source code or `.env` committed to git)
- [ ] Set `expiresAt` on all keys; rotate before expiry
- [ ] Use the minimum scope set your integration needs
- [ ] Implement `X-RateLimit-Remaining` monitoring to detect quota pressure
- [ ] Handle 429 responses with exponential backoff using `Retry-After`
- [ ] Include `X-Request-ID` in all requests for traceability
- [ ] Never share Firebase Admin credentials or Gemini/Stripe keys with MCP env

---

## Secrets discipline

**Never** pass these to MCP client env vars or third-party systems:

- `GEMINI_API_KEY`
- `STRIPE_SECRET_KEY`
- Firebase Admin credentials (`FIREBASE_PROJECT_ID` service account JSON)

API keys are rotatable via `DELETE /api/v1/keys/:keyId`. Only the key prefix is stored in list responses — the secret hash is in Firestore and never returned after creation.

---

## Firestore rules alignment

`api_keys`, `audit_logs`, `webhooks`, and `webhook_logs` collections are Admin SDK only — the client SDK cannot read or write them. Firestore security rules enforce `allow read, write: if false` on all four collections.

Curriculum uploads and parent notes remain client-Firestore only and are **not** exposed via the external API v1 surface.
