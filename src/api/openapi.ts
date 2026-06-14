import { z } from "zod"
import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from "@asteasolutions/zod-to-openapi"
import {
  ApiErrorBodySchema,
  CheckoutSchema,
  CreateApiKeySchema,
  GenerateHomeworkSchema,
  GenerateQuestSchema,
  InviteCodeSchema,
  PupilInviteSchema,
  QuestSchema,
  QuestPageSchema,
  SholaChatSchema,
  SyncPupilSchema,
  SyncBatchSchema,
  WebhookCreateSchema,
  WebhookSchema,
} from "./schemas/index"

const registry = new OpenAPIRegistry()

registry.register("ApiError", ApiErrorBodySchema)
registry.register("Quest", QuestSchema)
registry.register("QuestPage", QuestPageSchema)
registry.register("SyncBatch", SyncBatchSchema)
registry.register("WebhookCreate", WebhookCreateSchema)
registry.register("Webhook", WebhookSchema)

const errorResponse = (description: string) => ({
  description,
  content: { "application/json": { schema: ApiErrorBodySchema } },
})

const bearerAuth = registry.registerComponent("securitySchemes", "BearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT or ssa_live API key",
  description: "Firebase ID token or SSA API key (ssa_live_...)",
})

registry.registerPath({
  method: "get",
  path: "/api/v1/health",
  tags: ["Health"],
  responses: {
    200: {
      description: "Service health",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("ok"),
            service: z.string(),
            deploymentMode: z.string(),
            timestamp: z.number(),
          }),
        },
      },
    },
  },
})

registry.registerPath({
  method: "get",
  path: "/api/v1/quests",
  tags: ["Quests"],
  request: {
    query: z.object({
      class_level: z.string().optional().describe("Filter by class level, e.g. 'Class 4'"),
      subject: z.string().optional().describe("Filter by subject, e.g. 'Mathematics'"),
      cursor: z.string().optional().describe("Pagination cursor (last quest ID from previous page)"),
      limit: z.string().optional().describe("Page size (1–200, default 50)"),
    }),
  },
  responses: {
    200: { description: "Paginated quest catalog", content: { "application/json": { schema: QuestPageSchema } } },
    500: errorResponse("Internal error"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/sync",
  tags: ["Sync"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: SyncPupilSchema } } } },
  responses: {
    200: { description: "Sync result" },
    401: errorResponse("Unauthenticated"),
    400: errorResponse("Validation error"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/sync/batch",
  tags: ["Sync"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: SyncBatchSchema } } } },
  responses: {
    200: {
      description: "Batch sync results",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            results: z.array(z.object({ pupilId: z.string(), success: z.boolean(), error: z.string().optional() })),
          }),
        },
      },
    },
    401: errorResponse("Unauthenticated"),
    403: errorResponse("Forbidden — requires pupils:write scope"),
    400: errorResponse("Validation error"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/v1/teacher/students",
  tags: ["Teacher"],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: "Students and sync logs" }, 403: errorResponse("Forbidden") },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/teacher/generate-quest",
  tags: ["Teacher"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: GenerateQuestSchema } } } },
  responses: { 200: { description: "Quest draft" }, 429: errorResponse("Rate limited") },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/teacher/publish-quest",
  tags: ["Teacher"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: QuestSchema } } } },
  responses: { 200: { description: "Published quest" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/teacher/generate-invite",
  tags: ["Teacher"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: PupilInviteSchema } } } },
  responses: { 200: { description: "Invite code" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/parent/generate-homework",
  tags: ["Parent"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: GenerateHomeworkSchema } } } },
  responses: { 200: { description: "Homework draft" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/parent/publish-homework",
  tags: ["Parent"],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: "Published homework" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/parent/link-by-invite",
  tags: ["Parent"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: InviteCodeSchema } } } },
  responses: { 200: { description: "Linked pupil" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/shola/chat",
  tags: ["Pupil"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: SholaChatSchema } } } },
  responses: { 200: { description: "Shola reply" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/keys",
  tags: ["API Keys"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: CreateApiKeySchema } } } },
  responses: { 201: { description: "Created API key (secret shown once)" } },
})

registry.registerPath({
  method: "get",
  path: "/api/v1/keys",
  tags: ["API Keys"],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: "List API keys" } },
})

registry.registerPath({
  method: "delete",
  path: "/api/v1/keys/{keyId}",
  tags: ["API Keys"],
  security: [{ [bearerAuth.name]: [] }],
  responses: { 200: { description: "Revoked" } },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/billing/checkout",
  tags: ["Billing"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: CheckoutSchema } } } },
  responses: { 200: { description: "Checkout URL" } },
})

registry.registerPath({
  method: "post",
  path: "/api/billing/webhook",
  tags: ["Billing"],
  description: "Stripe webhook endpoint. Requires `stripe-signature` header. Body must be raw (not JSON-parsed). Set STRIPE_WEBHOOK_SECRET in env.",
  responses: {
    200: { description: "Webhook received" },
    400: errorResponse("Invalid signature"),
    503: errorResponse("Webhook not configured"),
  },
})

registry.registerPath({
  method: "post",
  path: "/api/v1/webhooks",
  tags: ["Webhooks"],
  security: [{ [bearerAuth.name]: [] }],
  request: { body: { content: { "application/json": { schema: WebhookCreateSchema } } } },
  responses: {
    201: {
      description: "Webhook registered. Secret shown once — store it securely.",
      content: { "application/json": { schema: z.object({ id: z.string(), secret: z.string(), url: z.string(), events: z.array(z.string()) }) } },
    },
    401: errorResponse("Unauthenticated"),
  },
})

registry.registerPath({
  method: "get",
  path: "/api/v1/webhooks",
  tags: ["Webhooks"],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: "List webhooks", content: { "application/json": { schema: z.array(WebhookSchema) } } },
  },
})

registry.registerPath({
  method: "delete",
  path: "/api/v1/webhooks/{webhookId}",
  tags: ["Webhooks"],
  security: [{ [bearerAuth.name]: [] }],
  responses: {
    200: { description: "Webhook deleted" },
    404: errorResponse("Not found"),
  },
})

export const generateOpenApiDocument = () => {
  const generator = new OpenApiGeneratorV31(registry.definitions)
  return generator.generateDocument({
    openapi: "3.1.0",
    info: {
      title: "Salone Stars Academy API",
      version: "1.0.0",
      description: "REST API for Salone Stars Academy — quests, pupil sync, teacher/parent tools.",
    },
    servers: [{ url: process.env.APP_URL || "http://localhost:3000" }],
    tags: [
      { name: "Health" },
      { name: "Quests" },
      { name: "Sync" },
      { name: "Teacher" },
      { name: "Parent" },
      { name: "Pupil" },
      { name: "API Keys" },
      { name: "Billing" },
      { name: "Webhooks" },
    ],
  })
}
