import { Router } from "express"
import { ZodError } from "zod"
import type { ServerDeps } from "./deps"
import { GenerateHomeworkSchema, InviteCodeSchema, PublishHomeworkSchema, QuestSchema } from "../../api/schemas/index"
import { requireAuthChain, type AuthenticatedRequest } from "../authMiddleware"
import { requirePremium, requireRole, requireScope, validateHomeworkPupil, validateParentChildLink } from "../rbac"
import { generateHomeworkDraft } from "../generateHomework"
import { parentHomeworkRateLimitAsync, setRateLimitHeaders } from "../rateLimiter"
import { ApiError, handleRouteError } from "../errors"
import { writeAuditLog } from "../auditLog"
import { deliverWebhook } from "../webhookDelivery"
import { zodFirstError, toQuest } from "../validation"

export const createParentRouter = (deps: ServerDeps) => {
  const router = Router()

  router.post(
    "/parent/generate-homework",
    ...requireAuthChain,
    requireRole("parent"),
    requireScope("ai:generate"),
    requirePremium,
    validateHomeworkPupil,
    async (req: AuthenticatedRequest, res) => {
      try {
        const input = GenerateHomeworkSchema.parse(req.body)
        const rateKey = req.auth!.keyId || req.auth!.uid
        const rate = await parentHomeworkRateLimitAsync(rateKey)
        setRateLimitHeaders(res, rate)
        if (!rate.allowed) {
          throw new ApiError("RATE_LIMITED", "Homework generation limit reached (5/day).", 429, { resetAt: rate.resetAt })
        }

        const draft = await generateHomeworkDraft(input)
        res.json({ success: true, quest: draft })
      } catch (err) {
        if (err instanceof ZodError) {
          return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
        }
        handleRouteError(res, err, "Failed to generate homework draft.")
      }
    }
  )

  router.post(
    "/parent/publish-homework",
    ...requireAuthChain,
    requireRole("parent"),
    requireScope("quests:write"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const body = PublishHomeworkSchema.parse(req.body)

        if ("questIds" in body && Array.isArray(body.questIds)) {
          const allQuests = await deps.db.getQuests()
          const selected = allQuests.filter(q => body.questIds.includes(q.id))
          if (!selected.length) throw new ApiError("VALIDATION_ERROR", "No matching quests found.", 400)

          const packQuest = toQuest({
            title: body.title || `Practice Pack — ${body.class_level}`,
            subject: selected.length === 1 ? selected[0].subject : "Mixed",
            class_level: body.class_level,
            points_award: selected.reduce((sum, q) => sum + q.points_award, 0),
            difficulty: "Medium",
            questions: selected.flatMap(q => q.questions).slice(0, 8),
            source: "parent-pack",
          }, { source: "parent-pack", teacherId: req.auth!.uid })
          packQuest.id = `q-home-${Math.random().toString(36).substring(2, 9)}`
          await deps.db.publishQuest(packQuest)

          await writeAuditLog({
            actorUid: req.auth!.uid,
            actorType: req.auth!.type,
            action: "publish_homework",
            resource: "quests",
            resourceId: packQuest.id,
            ip: req.ip,
            success: true,
            keyId: req.auth!.keyId,
          })

          deliverWebhook("homework.published", { questId: packQuest.id }, req.auth!.uid)
          return res.json({ success: true, quest: packQuest })
        }

        const questInput = QuestSchema.parse(body)
        const questWithMeta = toQuest(
          { ...questInput, subject: questInput.subject || "Mixed", source: "parent-pack" },
          { source: "parent-pack", teacherId: req.auth!.uid }
        )
        questWithMeta.id = questInput.id || `q-home-${Math.random().toString(36).substring(2, 9)}`
        await deps.db.publishQuest(questWithMeta)

        await writeAuditLog({
          actorUid: req.auth!.uid,
          actorType: req.auth!.type,
          action: "publish_homework",
          resource: "quests",
          resourceId: questWithMeta.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
          success: true,
          keyId: req.auth!.keyId,
        })

        deliverWebhook("homework.published", { questId: questWithMeta.id }, req.auth!.uid)
        res.json({ success: true, quest: questWithMeta })
      } catch (err) {
        if (err instanceof ZodError) {
          return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
        }
        handleRouteError(res, err, "Failed to publish practice pack.")
      }
    }
  )

  router.post(
    "/parent/link-by-invite",
    ...requireAuthChain,
    requireRole("parent"),
    requireScope("invites:write"),
    validateParentChildLink,
    async (req: AuthenticatedRequest, res) => {
      try {
        const { inviteCode } = InviteCodeSchema.parse(req.body)
        const pupil = await deps.db.linkPupilByInvite(inviteCode.trim(), req.auth!.uid)

        await writeAuditLog({
          actorUid: req.auth!.uid,
          actorType: req.auth!.type,
          action: "link_child",
          resource: "pupils",
          resourceId: pupil.id,
          ip: req.ip,
          userAgent: req.headers["user-agent"],
          requestId: req.requestId,
          success: true,
          keyId: req.auth!.keyId,
        })

        res.json({ success: true, pupil })
      } catch (err) {
        if (err instanceof ZodError) {
          return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
        }
        handleRouteError(res, err, "Failed to link pupil by invite.")
      }
    }
  )

  return router
}
