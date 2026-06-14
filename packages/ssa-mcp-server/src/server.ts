import { z } from "zod"
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { SsaConfig } from "./config.js"
import { hasAuth } from "./config.js"
import { SsaApiClient, ApiClientError } from "./client.js"

const SUBJECTS = ["Mathematics", "English", "Science", "Social Studies", "Krio"] as const
const CLASS_LEVELS = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6"] as const

type McpContent = { type: "text"; text: string }
type McpToolResult = { content: McpContent[]; isError?: boolean }

function mcpError(err: unknown): McpToolResult {
  if (err instanceof ApiClientError) {
    const detail: Record<string, unknown> = { code: err.code, message: err.message, status: err.status }
    if (err.retryAfter !== undefined) detail.retryAfter = err.retryAfter
    return {
      content: [{ type: "text", text: JSON.stringify(detail, null, 2) }],
      isError: true,
    }
  }
  return {
    content: [{ type: "text", text: JSON.stringify({ code: "INTERNAL", message: String(err) }, null, 2) }],
    isError: true,
  }
}

export const createMcpServer = (config: SsaConfig) => {
  const client = new SsaApiClient(config)
  const server = new McpServer({
    name: "salone-stars-academy",
    version: "1.0.0",
  })

  server.registerTool("ssa_auth_status", {
    description: "Report whether SSA API credentials are configured",
  }, async () => ({
    content: [{
      type: "text",
      text: JSON.stringify({
        apiUrl: config.apiUrl,
        authenticated: hasAuth(config),
        authMethod: config.apiKey ? "api_key" : config.firebaseToken ? "firebase" : "none",
      }, null, 2),
    }],
  }))

  server.registerTool("ssa_configure_auth", {
    description: "Document required env vars for SSA MCP authentication",
  }, async () => ({
    content: [{
      type: "text",
      text: [
        "Set in MCP client env:",
        "  SSA_API_URL — base URL",
        "  SSA_API_KEY — ssa_live_... OR SSA_FIREBASE_TOKEN — Firebase JWT",
        "Never pass GEMINI_API_KEY, STRIPE_SECRET_KEY, or Admin creds.",
      ].join("\n"),
    }],
  }))

  server.registerTool("ssa_get_health", {
    description: "Get Salone Stars Academy service health",
  }, async () => {
    try {
      const data = await client.get("/api/v1/health")
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_list_quests", {
    description: "List quest catalog with optional filters and cursor-based pagination",
    inputSchema: {
      class_level: z.string().optional().describe("e.g. Class 4"),
      subject: z.string().optional().describe("e.g. Mathematics"),
      cursor: z.string().optional().describe("ID of last quest from previous page"),
      limit: z.number().int().min(1).max(200).optional().describe("Results per page (default 50, max 200)"),
    },
  }, async ({ class_level, subject, cursor, limit }) => {
    try {
      const params = new URLSearchParams()
      if (class_level) params.set("class_level", class_level)
      if (subject) params.set("subject", subject)
      if (cursor) params.set("cursor", cursor)
      if (limit !== undefined) params.set("limit", String(limit))
      const qs = params.toString()
      const data = await client.get(`/api/v1/quests${qs ? `?${qs}` : ""}`)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_get_quest", {
    description: "Get a single quest by ID",
    inputSchema: { quest_id: z.string().describe("Quest ID") },
  }, async ({ quest_id }) => {
    try {
      const data = await client.get(`/api/v1/quests/${quest_id}`)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_get_teacher_students", {
    description: "Get teacher leaderboard and sync logs",
  }, async () => {
    try {
      const data = await client.get("/api/v1/teacher/students")
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_sync_pupil", {
    description: "Sync pupil progress",
    inputSchema: {
      id: z.string(),
      name: z.string(),
      class_level: z.string().optional(),
      points: z.number().optional(),
      delta_points: z.number().optional(),
      parentId: z.string().optional(),
    },
  }, async (args) => {
    try {
      const data = await client.post("/api/v1/sync", args)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_generate_quest_draft", {
    description: "Generate AI quest draft (teacher + premium, 10/hr)",
    inputSchema: {
      topic: z.string(),
      subject: z.string(),
      class_level: z.string(),
      difficulty: z.string().optional(),
    },
  }, async (args) => {
    try {
      const data = await client.post("/api/v1/teacher/generate-quest", args)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_publish_quest", {
    description: "Publish quest to catalog",
    inputSchema: { quest: z.record(z.string(), z.unknown()).describe("Full quest object") },
  }, async ({ quest }) => {
    try {
      const data = await client.post("/api/v1/teacher/publish-quest", quest)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_generate_homework_draft", {
    description: "Generate parent homework draft (5/day)",
    inputSchema: {
      topic: z.string().optional(),
      subject: z.string().optional(),
      class_level: z.string(),
      pupilId: z.string().optional(),
      weeklyTopics: z.string().optional(),
    },
  }, async (args) => {
    try {
      const data = await client.post("/api/v1/parent/generate-homework", args)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_publish_homework", {
    description: "Publish parent homework pack",
    inputSchema: { quest: z.record(z.string(), z.unknown()) },
  }, async ({ quest }) => {
    try {
      const data = await client.post("/api/v1/parent/publish-homework", quest)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_generate_invite", {
    description: "Generate parent invite code for pupil",
    inputSchema: { pupilId: z.string() },
  }, async ({ pupilId }) => {
    try {
      const data = await client.post("/api/v1/teacher/generate-invite", { pupilId })
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_link_child", {
    description: "Link child via invite code",
    inputSchema: { inviteCode: z.string() },
  }, async ({ inviteCode }) => {
    try {
      const data = await client.post("/api/v1/parent/link-by-invite", { inviteCode })
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  // C-1: Shola AI tutor chat (auth required, 50/day)
  server.registerTool("ssa_shola_chat", {
    description: "Send a message to Shola, the SSA AI tutor. Auth required. Subject to 50 messages/day rate limit.",
    inputSchema: {
      messages: z.array(z.object({
        role: z.enum(["shola", "pupil"]),
        content: z.string().max(500),
      })).min(1).max(20).describe("Conversation history ending with a pupil message"),
      class_level: z.string().describe("Pupil class level, e.g. 'Class 4'"),
      questContext: z.string().max(500).optional().describe("Optional quest context for Shola"),
    },
  }, async (args) => {
    try {
      const data = await client.post("/api/v1/shola/chat", args)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  // C-4: API key management (Firebase auth only — prevents key-from-key escalation)
  server.registerTool("ssa_list_api_keys", {
    description: "List API keys for the authenticated user (prefixes only, no secrets). Requires Firebase auth — not API key auth.",
  }, async () => {
    try {
      const data = await client.get("/api/v1/keys")
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_create_api_key", {
    description: "Create a scoped API key. Returns the secret once — store it securely. Requires Firebase auth — not API key auth.",
    inputSchema: {
      name: z.string().max(64).describe("Human-readable key name"),
      scopes: z.array(z.string()).min(1).describe("e.g. ['quests:read', 'pupils:write']"),
      rateLimitPerHour: z.number().int().min(1).max(10000).optional().describe("Max requests per hour (default 100)"),
      expiresAt: z.string().optional().describe("ISO 8601 expiry date"),
    },
  }, async (args) => {
    try {
      const data = await client.post("/api/v1/keys", args)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_revoke_api_key", {
    description: "Revoke an API key by ID. Requires Firebase auth.",
    inputSchema: { keyId: z.string().describe("API key ID to revoke") },
  }, async ({ keyId }) => {
    try {
      const data = await client.delete(`/api/v1/keys/${keyId}`)
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  server.registerTool("ssa_rotate_api_key", {
    description: "Atomically rotate an API key — creates a replacement with identical scopes and immediately revokes the old one. Requires Firebase auth.",
    inputSchema: { keyId: z.string().describe("API key ID to rotate") },
  }, async ({ keyId }) => {
    try {
      const data = await client.post(`/api/v1/keys/${keyId}/rotate`, {})
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] }
    } catch (err) { return mcpError(err) }
  })

  // ── MCP Resources ────────────────────────────────────────────────────────

  // Quest catalog snapshot (first page; paginate with ssa_list_quests + cursor)
  server.registerResource(
    "quest-catalog",
    "ssa://quests/catalog",
    {
      description: "Read-only quest catalog snapshot (first 50 quests). Use ssa_list_quests with cursor param for subsequent pages.",
      mimeType: "application/json",
    },
    async () => {
      try {
        const data = await client.get("/api/v1/quests?limit=50")
        return {
          contents: [{
            uri: "ssa://quests/catalog",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          }],
        }
      } catch (err) {
        const error = err instanceof ApiClientError
          ? { code: err.code, message: err.message }
          : { code: "INTERNAL", message: String(err) }
        return {
          contents: [{
            uri: "ssa://quests/catalog",
            mimeType: "application/json",
            text: JSON.stringify({ error }, null, 2),
          }],
        }
      }
    }
  )

  // Live teacher leaderboard (requires teacher auth)
  server.registerResource(
    "teacher-leaderboard",
    "ssa://teacher/students",
    {
      description: "Live class leaderboard and pupil sync logs. Requires teacher or teacher:* scope.",
      mimeType: "application/json",
    },
    async () => {
      try {
        const data = await client.get("/api/v1/teacher/students")
        return {
          contents: [{
            uri: "ssa://teacher/students",
            mimeType: "application/json",
            text: JSON.stringify(data, null, 2),
          }],
        }
      } catch (err) {
        const error = err instanceof ApiClientError
          ? { code: err.code, message: err.message }
          : { code: "INTERNAL", message: String(err) }
        return {
          contents: [{
            uri: "ssa://teacher/students",
            mimeType: "application/json",
            text: JSON.stringify({ error }, null, 2),
          }],
        }
      }
    }
  )

  // ── MCP Prompts ──────────────────────────────────────────────────────────

  // Teacher workflow: generate and publish an MBSSE-aligned quest
  server.registerPrompt("generate-quest-for-class", {
    description: "Generate and publish an MBSSE-aligned quest for a class. Calls ssa_generate_quest_draft then ssa_publish_quest.",
    argsSchema: {
      subject: z.enum(SUBJECTS).describe("MBSSE subject"),
      class_level: z.enum(CLASS_LEVELS).describe("Target class"),
      topic: z.string().max(256).optional().describe("Specific topic within the subject"),
      difficulty: z.enum(["easy", "medium", "hard"]).optional(),
    },
  }, ({ subject, class_level, topic, difficulty }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: [
          `Generate an MBSSE-aligned quest for ${class_level} ${subject}.`,
          topic ? `Topic: ${topic}.` : "",
          difficulty ? `Difficulty: ${difficulty}.` : "",
          "",
          "Steps:",
          "1. Call ssa_generate_quest_draft with the subject, class_level, and topic.",
          "2. Show me the draft questions and ask if I want to adjust anything.",
          "3. When approved, call ssa_publish_quest with the full quest object.",
          "4. Confirm the quest ID and title after publishing.",
        ].filter(Boolean).join("\n"),
      },
    }],
  }))

  // Parent workflow: build a 5-day homework plan from weekly topics
  server.registerPrompt("weekly-homework-plan", {
    description: "Build a 5-day homework plan for a child using their weekly school topics. Calls ssa_generate_homework_draft then ssa_publish_homework.",
    argsSchema: {
      class_level: z.enum(CLASS_LEVELS).describe("Child's class"),
      weekly_topics: z.string().max(500).describe("Topics the child is covering this week at school"),
      pupil_id: z.string().optional().describe("Pupil ID to personalise the plan"),
    },
  }, ({ class_level, weekly_topics, pupil_id }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: [
          `Create a 5-day homework plan for ${class_level}.`,
          `Weekly school topics: ${weekly_topics}.`,
          pupil_id ? `Pupil ID: ${pupil_id}.` : "",
          "",
          "Steps:",
          "1. Call ssa_generate_homework_draft with class_level and weeklyTopics.",
          "2. Present the draft plan day by day and ask if I want changes.",
          "3. When approved, call ssa_publish_homework with the full quest object.",
          "4. Share the published homework pack ID and title.",
        ].filter(Boolean).join("\n"),
      },
    }],
  }))

  // Teacher workflow: format a pupil progress report from leaderboard data
  server.registerPrompt("pupil-progress-report", {
    description: "Pull the teacher leaderboard and format a readable progress report for a class or individual pupil.",
    argsSchema: {
      pupil_name: z.string().optional().describe("Focus on one pupil (omit for full class report)"),
      format: z.enum(["summary", "detailed"]).optional().describe("Report depth (default: summary)"),
    },
  }, ({ pupil_name, format }) => ({
    messages: [{
      role: "user",
      content: {
        type: "text" as const,
        text: [
          "Generate a pupil progress report.",
          pupil_name ? `Focus on pupil: ${pupil_name}.` : "Include all pupils in the class.",
          `Format: ${format || "summary"}.`,
          "",
          "Steps:",
          "1. Call ssa_get_teacher_students to fetch the leaderboard and sync logs.",
          pupil_name
            ? `2. Filter to ${pupil_name} and highlight their points, streak, badges, and last active date.`
            : "2. Sort pupils by points descending. Flag pupils with no activity in the last 7 days.",
          "3. Format the report as a clear markdown table with a brief narrative summary.",
        ].filter(Boolean).join("\n"),
      },
    }],
  }))

  return server
}
