# Salone Stars Academy MCP Server

Thin MCP adapter over the SSA REST API v1. Tools map 1:1 to HTTP endpoints. The server exposes no Admin SDK, billing primitives, or raw Firestore access.

## Cursor / Claude Desktop (stdio)

Add to your MCP config:

```json
{
  "mcpServers": {
    "salone-stars-academy": {
      "command": "npx",
      "args": ["tsx", "packages/ssa-mcp-server/src/index.ts", "--stdio"],
      "env": {
        "SSA_API_URL": "http://localhost:3000",
        "SSA_API_KEY": "ssa_live_..."
      }
    }
  }
}
```

For production, build first:

```bash
cd packages/ssa-mcp-server && npm run build
```

Then use `node packages/ssa-mcp-server/dist/index.js --stdio`.

## Remote HTTP transport (recommended for production)

Deploy as a long-lived service (Railway, Fly.io, Cloud Run, or Pi co-located with Express):

```bash
SSA_API_URL=https://your-app.vercel.app \
SSA_API_KEY=ssa_live_... \
MCP_SSE_PORT=3100 \
MCP_SSE_API_KEY=ssa_live_... \
npx tsx packages/ssa-mcp-server/src/index.ts --sse --port=3100
```

> **Do not** run the MCP server inside a Vercel serverless function — it requires a persistent long-lived process.

### Streamable HTTP (MCP spec 2025-03-26, default for new clients)

The preferred transport for Claude.ai remote MCP connections and modern MCP clients. Uses a single `/mcp` endpoint.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/mcp` | Send MCP request (include `Mcp-Session-Id` header after first request) |
| GET | `/mcp` | Resume a session (SSE stream for server-initiated messages) |
| DELETE | `/mcp` | Terminate a session |
| GET | `/health` | MCP server health |

Auth: `X-SSA-Api-Key: ssa_live_...` or `Authorization: Bearer ssa_live_...` on every request.

**Claude.ai remote MCP config:**
```json
{
  "mcpServers": {
    "salone-stars-academy": {
      "url": "http://your-mcp-host:3100/mcp",
      "headers": { "X-SSA-Api-Key": "ssa_live_..." }
    }
  }
}
```

### Legacy SSE (backwards-compatible)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/sse` | Open SSE stream (requires `X-SSA-Api-Key` or `Authorization: Bearer`) |
| POST | `/message?sessionId=...` | MCP message channel |
| GET | `/health` | MCP server health |

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SSA_API_URL` | Yes | Base URL of SSA Express API |
| `SSA_API_KEY` | One of | Institutional API key (`ssa_live_...`) |
| `SSA_FIREBASE_TOKEN` | One of | Short-lived Firebase ID token |
| `MCP_SSE_PORT` | No | SSE listen port (default 3100) |
| `MCP_SSE_API_KEY` | Recommended for SSE | Protects SSE handshake |
| `MCP_TRANSPORT` | No | Set to `sse` to default to SSE mode |

---

## Tool catalog

### Public (no auth)

| Tool | REST |
|------|------|
| `ssa_get_health` | `GET /api/v1/health` |
| `ssa_list_quests` | `GET /api/v1/quests` |

### Authenticated

| Tool | REST | Scope |
|------|------|-------|
| `ssa_get_quest` | `GET /api/v1/quests/:id` | `quests:read` |
| `ssa_sync_pupil` | `POST /api/v1/sync` | `pupils:write` |
| `ssa_shola_chat` | `POST /api/v1/shola/chat` | Auth required, 50/day |
| `ssa_get_teacher_students` | `GET /api/v1/teacher/students` | teacher / `pupils:read` |
| `ssa_generate_quest_draft` | `POST /api/v1/teacher/generate-quest` | teacher + premium, 10/hr |
| `ssa_publish_quest` | `POST /api/v1/teacher/publish-quest` | `quests:write` |
| `ssa_generate_homework_draft` | `POST /api/v1/parent/generate-homework` | parent + premium, 5/day |
| `ssa_publish_homework` | `POST /api/v1/parent/publish-homework` | `quests:write` |
| `ssa_generate_invite` | `POST /api/v1/teacher/generate-invite` | teacher |
| `ssa_link_child` | `POST /api/v1/parent/link-by-invite` | parent |

### API key management

These tools require Firebase auth (not API key auth) to prevent key-from-key privilege escalation.

| Tool | REST | Notes |
|------|------|-------|
| `ssa_list_api_keys` | `GET /api/v1/keys` | Returns prefixes only |
| `ssa_create_api_key` | `POST /api/v1/keys` | Secret returned once |
| `ssa_revoke_api_key` | `DELETE /api/v1/keys/:keyId` | Immediate revocation |
| `ssa_rotate_api_key` | `POST /api/v1/keys/:keyId/rotate` | Atomic replace + revoke |

### Auth bootstrap

| Tool | Purpose |
|------|---------|
| `ssa_auth_status` | Check if credentials are configured |
| `ssa_configure_auth` | Document required env vars |

### Resources

| URI | Description |
|-----|-------------|
| `ssa://quests/catalog` | First 50 quests snapshot. Use `ssa_list_quests` with `cursor` for subsequent pages. |
| `ssa://teacher/students` | Live class leaderboard and sync logs. Requires teacher auth. |

**Never exposed via MCP:** billing, Stripe webhook, mock payment, raw Firestore, Admin SDK.

---

## Prompts

Prompts are discoverable workflow templates that MCP clients (Claude, Cursor) surface as one-click actions. They guide the AI through multi-step SSA workflows without extra user prompting.

### `generate-quest-for-class`

Generate and publish an MBSSE-aligned quest. Walks through draft → review → publish.

**Args:** `subject` (required), `class_level` (required), `topic` (optional), `difficulty` (optional)

**Workflow:** `ssa_generate_quest_draft` → user review → `ssa_publish_quest`

### `weekly-homework-plan`

Build a 5-day homework plan from a child's weekly school topics. Generates a draft, asks for approval, then publishes.

**Args:** `class_level` (required), `weekly_topics` (required), `pupil_id` (optional)

**Workflow:** `ssa_generate_homework_draft` → user review → `ssa_publish_homework`

### `pupil-progress-report`

Pull the teacher leaderboard and format a readable progress report.

**Args:** `pupil_name` (optional — omit for full class), `format` (`summary` | `detailed`, default `summary`)

**Workflow:** `ssa_get_teacher_students` → formatted markdown table + narrative

---

## Tool examples

### `ssa_shola_chat`

Ask Shola a tutoring question on behalf of a pupil:

```json
{
  "messages": [
    { "role": "shola", "content": "Hi! What are we learning today?" },
    { "role": "pupil", "content": "I need help with fractions" }
  ],
  "class_level": "Class 4",
  "questContext": "Quest: Introduction to Fractions"
}
```

Response:
```json
{
  "reply": "Great! A fraction has two parts...",
  "xpAwarded": 5
}
```

XP is awarded server-side with a 2-minute cooldown; client-side counts are ignored.

### `ssa_list_quests` (with pagination)

```json
{ "class_level": "Class 4", "subject": "Mathematics", "limit": 50 }
```

Response:
```json
{
  "quests": [...],
  "nextCursor": "q-050"
}
```

Fetch the next page:
```json
{ "class_level": "Class 4", "subject": "Mathematics", "cursor": "q-050", "limit": 50 }
```

### `ssa_create_api_key`

```json
{
  "name": "Freetown Primary LMS",
  "scopes": ["quests:read", "pupils:read"],
  "rateLimitPerHour": 500,
  "expiresAt": "2027-01-01T00:00:00Z"
}
```

Response (secret shown **once**):
```json
{
  "keyId": "key-abc123",
  "prefix": "ssa_live_xxxx",
  "secret": "ssa_live_xxxxxxxxxxxxxxxxxxxx"
}
```

---

## Error handling

MCP tool errors return `isError: true` with a structured body:

```json
{
  "content": [{ "type": "text", "text": "{ \"code\": \"RATE_LIMITED\", \"message\": \"Quest generation limit reached (10/hour).\", \"status\": 429, \"retryAfter\": 3547 }" }],
  "isError": true
}
```

### Error code actions

| `code` | HTTP | Recommended action |
|--------|------|--------------------|
| `UNAUTHENTICATED` | 401 | Set `SSA_API_KEY` or `SSA_FIREBASE_TOKEN` in env |
| `FORBIDDEN` | 403 | Check role and scope; upgrade plan for AI tools |
| `NOT_FOUND` | 404 | Verify the resource ID |
| `VALIDATION_ERROR` | 400 | Fix request body schema |
| `RATE_LIMITED` | 429 | Wait `retryAfter` seconds, then retry |
| `INTERNAL` | 500 | Retry once; if persists, report issue |

---

## Development

```bash
npm run mcp:dev          # stdio with tsx watch (from repo root)
npm run verify:openapi   # smoke-test API (server must be running)
```
