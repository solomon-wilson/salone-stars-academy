import { Router } from "express"
import { ZodError } from "zod"
import type { ServerDeps } from "./deps"
import { GenerateQuestSchema, QuestSchema } from "../../api/schemas/index"
import { requireAuthChain, type AuthenticatedRequest } from "../authMiddleware"
import { requirePremium, requireRole, requireScope, validateTeacherPupilInvite } from "../rbac"
import { generateQuestDraft } from "../generateQuest"
import { geminiRateLimitAsync, setRateLimitHeaders } from "../rateLimiter"
import { ApiError, handleRouteError } from "../errors"
import { writeAuditLog } from "../auditLog"
import { deliverWebhook } from "../webhookDelivery"
import { zodFirstError, toQuest } from "../validation"

export const createTeacherRouter = (deps: ServerDeps) => {
  const router = Router()

  router.get("/teacher/students", ...requireAuthChain, requireRole("teacher"), requireScope("pupils:read"), async (_req, res) => {
    try {
      res.json(await deps.db.getStudentsAndLogs())
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch student statistics.")
    }
  })

  router.post(
    "/teacher/generate-quest",
    ...requireAuthChain,
    requireRole("teacher"),
    requireScope("ai:generate"),
    requirePremium,
    async (req: AuthenticatedRequest, res) => {
      try {
        const input = GenerateQuestSchema.parse(req.body)
        const rateKey = req.auth!.keyId || req.auth!.uid
        const rate = await geminiRateLimitAsync(rateKey)
        setRateLimitHeaders(res, rate)
        if (!rate.allowed) {
          throw new ApiError("RATE_LIMITED", "Quest generation limit reached (10/hour).", 429, { resetAt: rate.resetAt })
        }

        const draft = await generateQuestDraft(input)
        res.json({ success: true, quest: draft })
      } catch (err) {
        if (err instanceof ZodError) {
          return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
        }
        handleRouteError(res, err, "Failed to generate quest draft.")
      }
    }
  )

  router.post(
    "/teacher/publish-quest",
    ...requireAuthChain,
    requireRole("teacher"),
    requireScope("quests:write"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const newQuest = QuestSchema.parse(req.body)
        const questWithMeta = toQuest(newQuest, { source: "generated", teacherId: req.auth!.uid })
        if (newQuest.id) questWithMeta.id = newQuest.id
        else questWithMeta.id = `q-pub-${Math.random().toString(36).substring(2, 9)}`
        await deps.db.publishQuest(questWithMeta)

        await writeAuditLog({
          actorUid: req.auth!.uid,
          actorType: req.auth!.type,
          action: "publish_quest",
          resource: "quests",
          resourceId: questWithMeta.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
          success: true,
          keyId: req.auth!.keyId,
        })

        deliverWebhook("quest.published", { questId: questWithMeta.id, subject: questWithMeta.subject }, req.auth!.uid)
        res.json({ success: true, quest: questWithMeta })
      } catch (err) {
        if (err instanceof ZodError) {
          return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
        }
        handleRouteError(res, err, "Failed to publish quest to catalog.")
      }
    }
  )

  router.post(
    "/teacher/generate-invite",
    ...requireAuthChain,
    requireRole("teacher"),
    requireScope("invites:write"),
    validateTeacherPupilInvite,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { pupilId } = req.body
        if (!pupilId) throw new ApiError("VALIDATION_ERROR", "pupilId is required.", 400)

        const code = await deps.db.createPupilInvite(pupilId, req.auth!.uid)
        res.json({ code, pupilId })
      } catch (err) {
        handleRouteError(res, err, "Failed to generate invite code.")
      }
    }
  )

  return router
}
