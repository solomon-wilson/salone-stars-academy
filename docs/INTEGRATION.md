# Integration Guide

Practical patterns for connecting external systems to Salone Stars Academy.

---

## SIS / LMS integration (batch pupil sync)

School information systems can push pupil progress records in bulk using the batch sync endpoint with a teacher API key.

### Step 1 — Create a scoped key

```bash
curl -X POST https://your-app.vercel.app/api/v1/keys \
  -H "Authorization: Bearer $TEACHER_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Freetown Primary SIS",
    "scopes": ["pupils:write", "quests:read"],
    "rateLimitPerHour": 1000
  }'
```

Store the returned `secret` in your secret manager. The `keyId` is for revocation later.

### Step 2 — Sync pupil batch

Max 50 pupils per call. Wrap in your own pagination loop for larger cohorts.

**TypeScript:**
```ts
const res = await fetch("https://your-app.vercel.app/api/v1/sync/batch", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.SSA_API_KEY}`,
    "Content-Type": "application/json",
    "X-Request-ID": crypto.randomUUID(),
  },
  body: JSON.stringify({
    pupils: [
      {
        id: "pupil-001",
        name: "Amara Koroma",
        class_level: "Class 4",
        points: 340,
        streak_count: 5,
        last_active_date: "2026-06-14",
        badges_earned: ["star-1", "star-2"],
      },
    ],
  }),
})
const { results } = await res.json()
// results: [{ pupilId: "pupil-001", success: true }]
```

**Python:**
```python
import httpx, uuid

resp = httpx.post(
    "https://your-app.vercel.app/api/v1/sync/batch",
    headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-Request-ID": str(uuid.uuid4()),
    },
    json={"pupils": pupils},
    timeout=30,
)
resp.raise_for_status()
results = resp.json()["results"]
```

### Step 3 — Key rotation workflow

1. Create new key with same scopes
2. Update your service's `SSA_API_KEY` env var
3. Redeploy/restart the service
4. Delete the old key: `DELETE /api/v1/keys/{oldKeyId}`

---

## Claude Desktop / MCP setup

Connect Claude Desktop to Salone Stars Academy to let Claude assist with quest creation, pupil progress, and AI tutoring.

### Quickstart

1. **Get an API key** from the SSA admin interface (or via `POST /api/v1/keys`)

2. **Add to Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "salone-stars-academy": {
      "command": "npx",
      "args": ["tsx", "/path/to/salone-stars-academy/packages/ssa-mcp-server/src/index.ts", "--stdio"],
      "env": {
        "SSA_API_URL": "https://your-app.vercel.app",
        "SSA_API_KEY": "ssa_live_..."
      }
    }
  }
}
```

3. **Restart Claude Desktop** and verify with: "Use ssa_auth_status to check my SSA connection"

### Available capabilities

Once connected, Claude can:
- Browse the quest catalog: `ssa_list_quests`
- Generate AI quests (teacher + premium): `ssa_generate_quest_draft`
- Chat with Shola AI tutor on behalf of a pupil: `ssa_shola_chat`
- Sync pupil progress: `ssa_sync_pupil`
- Manage API keys: `ssa_list_api_keys`, `ssa_create_api_key`

See [MCP.md](./MCP.md) for the full tool catalog.

---

## Webhook integration (event-driven)

Receive real-time notifications when quests are published, pupils sync progress, or homework is released.

### Step 1 — Register a webhook

```bash
curl -X POST https://your-app.vercel.app/api/v1/webhooks \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-lms.example.com/ssa-events",
    "events": ["quest.published", "pupil.synced", "homework.published"]
  }'
```

Response:
```json
{
  "id": "wh-abc123",
  "url": "https://your-lms.example.com/ssa-events",
  "events": ["quest.published", "pupil.synced", "homework.published"],
  "secret": "wh_live_xxxxxxxx"
}
```

Store `secret` immediately — it is not returned again.

### Step 2 — Verify incoming requests

Every webhook delivery includes `X-SSA-Signature: sha256=<hex>`. Verify with your secret before processing:

**Node.js:**
```ts
import crypto from "crypto"

function verifyWebhook(body: string, signature: string, secret: string): boolean {
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex")
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// Express handler
app.post("/ssa-events", express.raw({ type: "application/json" }), (req, res) => {
  const sig = req.headers["x-ssa-signature"] as string
  if (!verifyWebhook(req.body.toString(), sig, process.env.SSA_WEBHOOK_SECRET!)) {
    return res.status(401).json({ error: "Invalid signature" })
  }
  const event = JSON.parse(req.body.toString())
  // handle event.type: "quest.published" | "pupil.synced" | "homework.published"
  res.json({ received: true })
})
```

**Python:**
```python
import hashlib, hmac

def verify_webhook(body: bytes, signature: str, secret: str) -> bool:
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(signature, expected)
```

### Event payload shapes

**`quest.published`**
```json
{ "event": "quest.published", "questId": "q-abc", "subject": "Mathematics" }
```

**`pupil.synced`**
```json
{ "event": "pupil.synced", "pupilId": "pupil-001", "points": 340 }
```

**`homework.published`**
```json
{ "event": "homework.published", "questId": "q-home-xyz" }
```

### Retry behavior

SSA retries failed deliveries 3 times with exponential backoff (5s → 25s → 125s). Your endpoint should respond `2xx` within 10 seconds. Return `2xx` immediately and process async.

---

## Rate limit best practices

### Read `X-RateLimit-*` headers

Every response includes:
- `X-RateLimit-Limit`: max requests in this window
- `X-RateLimit-Remaining`: how many are left
- `X-RateLimit-Reset`: Unix epoch when the window resets
- `Retry-After`: seconds to wait (only on 429 responses)

### Exponential backoff example

```ts
async function fetchWithBackoff(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, options)
    if (res.status === 429) {
      const retryAfter = parseInt(res.headers.get("Retry-After") || "60", 10)
      await new Promise(r => setTimeout(r, retryAfter * 1000))
      continue
    }
    if (!res.ok && res.status >= 500 && attempt < retries - 1) {
      await new Promise(r => setTimeout(r, (2 ** attempt) * 1000))
      continue
    }
    return res
  }
  throw new Error("Max retries exceeded")
}
```

### Offline resilience (Sierra Leone 2G/3G)

Wrap all calls in offline detection. Queue failures to IndexedDB under the key `ssa_sync_queue` and flush on reconnect via Background Sync API (`tag: 'sync-pupil-progress'`). On `QuotaExceededError`, evict the oldest entries from the queue before writing.

---

## Troubleshooting

### "UNAUTHENTICATED" on every request

Check that `SSA_API_KEY` starts with `ssa_live_`. Ensure the header is `Authorization: Bearer ssa_live_...` (not `X-SSA-Api-Key` if your framework strips custom headers).

### "FORBIDDEN" on teacher routes

API keys need `teacher:*` scope OR `role === teacher` from Firebase auth. Firebase auth alone is insufficient — the Firestore profile must have `role: "teacher"`.

### AI generation returns "FORBIDDEN" with premium error

The `subscriptionPlan` on the user's Firestore profile must be `individual` or `team`. Subscription updates via client SDK are blocked by Firestore rules — they flow through the Stripe webhook → Firebase Admin SDK path only. Allow up to 55 minutes for the Redis token cache to expire after an upgrade.

### Webhook deliveries not arriving

1. Ensure your endpoint returns `2xx` within 10 seconds
2. Verify `X-SSA-Signature` is being read correctly (raw body, not parsed JSON)
3. Check that the webhook is still `active: true` via `GET /api/v1/webhooks`

### Correlation tracing

Include `X-Request-ID` on all requests. The server echoes it back. Use the same ID in support tickets to correlate server logs.
