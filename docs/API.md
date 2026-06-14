# Salone Stars Academy REST API

Versioned REST API at `/api/v1/*`. Legacy `/api/*` routes remain available with `Deprecation: true` headers for 90 days.

## Quick start

```bash
# Health check (no auth)
curl https://your-app.vercel.app/api/v1/health

# Quest catalog (no auth, CDN cached)
curl "https://your-app.vercel.app/api/v1/quests?class_level=Class%204&subject=Mathematics"
```

Interactive docs: `GET /api/docs`  
Machine-readable spec: `GET /api/openapi.json`

---

## Authentication

Two credential types are supported:

| Type | Header | Use case |
|------|--------|----------|
| Firebase ID token | `Authorization: Bearer <jwt>` | Teachers, parents, user-context MCP |
| API key | `Authorization: Bearer ssa_live_...` or `X-SSA-Api-Key` | Institutional M2M integrations |

See [AUTH.md](./AUTH.md) for scope matrix and key management.

---

## Response headers

Every response includes:

| Header | Description |
|--------|-------------|
| `X-Request-ID` | Correlation ID — echo from `X-Request-ID` request header or UUID generated server-side |
| `X-RateLimit-Limit` | Window capacity for rate-limited routes |
| `X-RateLimit-Remaining` | Remaining calls in the current window |
| `X-RateLimit-Reset` | Unix epoch (seconds) when the window resets |
| `Retry-After` | Seconds until retry (only on 429 responses) |

Include `X-Request-ID` in support requests to correlate server logs.

---

## Error envelope

All v1 errors return:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Requires role: teacher",
    "details": {}
  }
}
```

### Error codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHENTICATED` | 401 | Missing or invalid credentials |
| `FORBIDDEN` | 403 | Valid credentials but insufficient role/scope/plan |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Request body failed schema validation |
| `RATE_LIMITED` | 429 | Rate limit exceeded; check `Retry-After` |
| `INTERNAL` | 500 | Unexpected server error |

---

## Rate limits

| Endpoint | Limit |
|----------|-------|
| `POST /api/v1/teacher/generate-quest` | 10/hour per user or API key |
| `POST /api/v1/parent/generate-homework` | 5/day per user or API key |
| `POST /api/v1/shola/chat` | 50/day per user or API key |

Redis-backed when `REDIS_URL` is set; in-memory fallback for Pi offline mode. Per-key `rateLimitPerHour` overrides apply when set on the key record.

---

## Endpoints

### Health

#### `GET /api/v1/health`

No auth required.

**Response:**
```json
{
  "status": "ok",
  "service": "salone-stars-academy",
  "deploymentMode": "cloud",
  "timestamp": 1718376000000
}
```

---

### Quest catalog

#### `GET /api/v1/quests`

No auth required. CDN-cached (`Cache-Control: public, max-age=300, stale-while-revalidate=60`).

**Query params:**

| Param | Type | Description |
|-------|------|-------------|
| `class_level` | string | Filter by class, e.g. `Class 4` |
| `subject` | string | Filter by subject, e.g. `Mathematics` |
| `cursor` | string | Quest ID to start after (pagination) |
| `limit` | integer | Results per page (1–200, default 50) |

**Response:**
```json
{
  "quests": [
    {
      "id": "q-001",
      "title": "Counting to 100",
      "subject": "Mathematics",
      "class_level": "Class 1",
      "points_award": 10,
      "difficulty": "Easy",
      "questions": [...]
    }
  ],
  "nextCursor": "q-050"
}
```

`nextCursor` is `null` when there are no further pages.

#### `GET /api/v1/quests/:id`

No auth required.

---

### Pupil sync

#### `POST /api/v1/sync`

Auth optional in Pi LAN mode; required in cloud/hybrid.

**Body:**
```json
{
  "id": "pupil-abc",
  "name": "Amara Koroma",
  "class_level": "Class 4",
  "points": 120,
  "delta_points": 10,
  "streak_count": 3,
  "last_active_date": "2026-06-14",
  "badges_earned": ["star-1"],
  "parentId": "uid-parent-xyz"
}
```

**Response:**
```json
{
  "success": true,
  "serverLeaderboard": [...],
  "syncTime": 1718376000000
}
```

#### `POST /api/v1/sync/batch`

Requires auth (`pupils:write` scope). Max 50 pupils per call.

**Body:**
```json
{
  "pupils": [
    { "id": "pupil-abc", "name": "Amara Koroma", "class_level": "Class 4", "points": 120 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    { "pupilId": "pupil-abc", "success": true }
  ]
}
```

---

### Teacher routes

All routes in this section require `role === teacher` OR a key with `teacher:*` scope.

#### `GET /api/v1/teacher/students`

Scope: `pupils:read`

Returns leaderboard and sync logs for the teacher's classroom.

#### `POST /api/v1/teacher/generate-quest`

Scope: `ai:generate` + premium plan. Rate limit: 10/hour.

**Body:**
```json
{
  "topic": "Addition with carrying",
  "subject": "Mathematics",
  "class_level": "Class 3",
  "difficulty": "Medium"
}
```

**Response:** `{ "success": true, "quest": { ... } }`

#### `POST /api/v1/teacher/publish-quest`

Scope: `quests:write`

**Body:** Full quest object (same schema as quest catalog entry).

#### `POST /api/v1/teacher/generate-invite`

Scope: `invites:write`

**Body:** `{ "pupilId": "pupil-abc" }`

**Response:** `{ "code": "INV-XXXX", "pupilId": "pupil-abc" }`

---

### Parent routes

All routes in this section require `role === parent` OR a key with `parent:*` scope.

#### `POST /api/v1/parent/generate-homework`

Scope: `ai:generate` + premium plan. Rate limit: 5/day.

**Body:**
```json
{
  "topic": "Times tables",
  "subject": "Mathematics",
  "class_level": "Class 4",
  "pupilId": "pupil-abc",
  "weeklyTopics": "Multiplication, division"
}
```

**Response:** `{ "success": true, "quest": { ... } }`

#### `POST /api/v1/parent/publish-homework`

Scope: `quests:write`

Accepts either a full quest object or `{ "questIds": [...], "class_level": "Class 4", "title": "..." }` to bundle existing quests.

#### `POST /api/v1/parent/link-by-invite`

Scope: `invites:write`

**Body:** `{ "inviteCode": "INV-XXXX" }`

**Response:** `{ "success": true, "pupil": { ... } }`

---

### Shola AI tutor

#### `POST /api/v1/shola/chat`

Auth required. Rate limit: 50/day.

**Body:**
```json
{
  "messages": [
    { "role": "shola", "content": "Hello! What would you like to learn today?" },
    { "role": "pupil", "content": "Can you help me with fractions?" }
  ],
  "class_level": "Class 4",
  "questContext": "Quest: Introduction to Fractions"
}
```

**Response:**
```json
{
  "reply": "Sure! A fraction has two parts: a numerator on top and a denominator on the bottom...",
  "xpAwarded": 5
}
```

XP is awarded server-side with a 2-minute cooldown per user; client XP counts are ignored.

---

### API key management

#### `POST /api/v1/keys`

Requires Firebase auth (not API key auth — prevents key-from-key escalation).

**Body:**
```json
{
  "name": "Freetown Primary LMS",
  "scopes": ["quests:read", "pupils:read"],
  "rateLimitPerHour": 500,
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

**Response:** `{ "keyId": "...", "prefix": "ssa_live_xxxx", "secret": "ssa_live_..." }`

The `secret` is returned **once**. Store it immediately.

#### `GET /api/v1/keys`

Requires Firebase auth. Returns prefix list (no secrets).

#### `DELETE /api/v1/keys/:keyId`

Requires Firebase auth. Revokes key immediately.

#### `POST /api/v1/keys/:keyId/rotate`

Requires Firebase auth. Atomically creates a replacement key with the same name, scopes, and rate limit, then revokes the old key in a single Firestore batch. The old key is invalidated immediately.

**Response:** `{ "keyId": "...", "prefix": "ssa_live_xxxx", "secret": "ssa_live_..." }`

The new `secret` is returned **once**.

---

### Outbound webhooks

#### `POST /api/v1/webhooks`

Auth required. Register a webhook endpoint for server-sent events.

**Body:**
```json
{
  "url": "https://your-lms.example.com/ssa-webhook",
  "events": ["quest.published", "pupil.synced", "homework.published"]
}
```

**Response:** `{ "id": "...", "url": "...", "events": [...], "secret": "wh_..." }`

The `secret` is returned **once** — use it to verify `X-SSA-Signature: sha256=<hex>` on incoming requests.

**Supported events:** `quest.published`, `pupil.synced`, `homework.published`, `api_key.created`, `api_key.revoked`

#### `GET /api/v1/webhooks`

Auth required. Returns list of active webhooks (no secrets).

#### `DELETE /api/v1/webhooks/:webhookId`

Auth required. Deactivates the webhook.

#### Webhook payload format

Every delivery is an HTTP `POST` with these headers:

| Header | Value |
|--------|-------|
| `Content-Type` | `application/json` |
| `X-SSA-Signature` | `sha256=<hex>` HMAC-SHA256 of the raw body, signed with your webhook secret |
| `X-SSA-Event` | Event name, e.g. `pupil.synced` |
| `X-SSA-Delivery-Attempt` | `1`, `2`, or `3` |

Body:
```json
{
  "event": "pupil.synced",
  "data": { "pupilId": "pupil-abc", "points": 120 },
  "timestamp": "2026-06-14T10:00:00.000Z"
}
```

**Verify the signature (TypeScript):**
```ts
import crypto from "crypto"

function verifyWebhook(rawBody: string, signature: string, secret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}
```

**Verify the signature (Python):**
```python
import hmac, hashlib

def verify_webhook(raw_body: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), raw_body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

**Retry behaviour:** 3 attempts with delays of 5 s, 25 s, and 125 s. Respond with any 2xx to acknowledge; non-2xx 5xx responses trigger a retry, 4xx do not.

#### CORS for integration origins

By default the API allows requests from `APP_URL` only. To permit additional origins (e.g. an LMS dashboard):

```bash
INTEGRATION_ORIGINS=https://lms.freetown.edu.sl,https://dashboard.ssa.example.com
```

These origins receive full CORS headers alongside the primary app URL.

---

### Billing

#### `POST /api/v1/billing/checkout`

Auth required. Initiates Stripe checkout session.

**Body:** `{ "userId": "...", "planName": "individual", "email": "...", "subscriberRole": "teacher" }`

> **Note:** Use `planName` (not `plan`) and `email` (not `userEmail`). Mismatched field names are a common integration error.

#### `POST /api/billing/webhook`

Stripe-signed webhook receiver. Must send raw body with `Stripe-Signature` header. Not for direct integration — this is Stripe's outbound call to the server.

---

## Verification

```bash
npm run verify:openapi   # smoke-tests OpenAPI spec + all v1 routes (server must be running)
npm run verify:sync      # LWW merge + auth enforcement
npm run verify:publish   # quest validation
npm run verify:parent    # parent flow + protected routes
```

## MCP integration

For AI agent access via Model Context Protocol, see [MCP.md](./MCP.md).
