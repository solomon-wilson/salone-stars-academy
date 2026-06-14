import { z } from "zod"
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi"

extendZodWithOpenApi(z)

export const ApiErrorCodeSchema = z.enum([
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "NOT_FOUND",
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "INTERNAL",
])

export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
}).openapi("ApiError")

export const QuestionSchema = z.object({
  questionText: z.string().min(1).max(512),
  options: z.array(z.string().min(1).max(256)).min(2).max(6),
  correctOption: z.string().min(1).max(256),
  explanation: z.string().min(1).max(1024),
  krioInstruction: z.string().max(256).optional().default(""),
})

export const QuestSchema = z.object({
  id: z.string().max(128).optional(),
  title: z.string().min(1).max(256),
  subject: z.string().min(1).max(128),
  class_level: z.string().min(1).max(64),
  points_award: z.number().int().min(0).optional(),
  difficulty: z.string().max(32).optional(),
  questions: z.array(QuestionSchema).min(1).max(20),
  source: z.enum(["default", "generated", "bank", "parent-pack"]).optional(),
  teacherId: z.string().optional(),
  alignedMbsseOutcome: z.string().max(512).optional(),
}).openapi("Quest")

export const SyncPupilSchema = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(128),
  class_level: z.string().max(64).optional(),
  points: z.number().int().min(0).optional(),
  streak_count: z.number().int().min(0).optional(),
  last_active_date: z.string().optional(),
  badges_earned: z.array(z.string().max(64)).max(32).optional(),
  delta_points: z.number().int().optional(),
  parentId: z.string().max(128).optional(),
  subject_stats: z.record(
    z.string(),
    z.object({ correct: z.number().int().min(0), total: z.number().int().min(0) })
  ).optional(),
})

export const GenerateQuestSchema = z.object({
  topic: z.string().min(1).max(512),
  subject: z.string().min(1).max(128),
  class_level: z.string().min(1).max(64),
  difficulty: z.string().max(32).optional(),
  questionCount: z.number().int().min(1).max(10).optional(),
})

export const GenerateHomeworkSchema = GenerateQuestSchema.extend({
  pupilId: z.string().max(128).optional(),
  weeklyTopics: z.string().max(500).optional(),
})

export const PublishHomeworkSchema = z.union([
  z.object({
    questIds: z.array(z.string()).min(1).max(10),
    class_level: z.string().min(1).max(64),
    title: z.string().max(256).optional(),
  }),
  QuestSchema,
])

export const SholaChatSchema = z.object({
  class_level: z.string().min(1).max(64),
  questContext: z.string().max(256).optional(),
  messages: z.array(z.object({
    role: z.enum(["shola", "pupil"]),
    content: z.string().max(2000),
    timestamp: z.string().optional(),
  })).min(1).max(50),
})

export const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(128),
  scopes: z.array(z.string()).min(1).max(10),
  rateLimitPerHour: z.number().int().min(1).max(10000).optional(),
})

export const InviteCodeSchema = z.object({
  inviteCode: z.string().min(4).max(32),
})

export const PupilInviteSchema = z.object({
  pupilId: z.string().min(1).max(128),
})

export const CheckoutSchema = z.object({
  userId: z.string().min(1).max(128),
  planName: z.enum(["individual", "team"]),
  email: z.string().email().optional(),
  subscriberRole: z.enum(["parent", "teacher"]).optional(),
})

export const SyncBatchSchema = z.object({
  pupils: z.array(SyncPupilSchema).min(1).max(50),
}).openapi("SyncBatch")

export const QuestPageSchema = z.object({
  quests: z.array(QuestSchema),
  nextCursor: z.string().nullable(),
}).openapi("QuestPage")

export const WebhookCreateSchema = z.object({
  url: z.string().url().max(2048),
  events: z.array(z.enum([
    "quest.published",
    "pupil.synced",
    "homework.published",
    "api_key.created",
    "api_key.revoked",
  ])).min(1).max(5),
}).openapi("WebhookCreate")

export const WebhookSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  events: z.array(z.string()),
  active: z.boolean(),
  createdAt: z.string(),
}).openapi("Webhook")

export type QuestInput = z.infer<typeof QuestSchema>
export type SyncPupilInput = z.infer<typeof SyncPupilSchema>
