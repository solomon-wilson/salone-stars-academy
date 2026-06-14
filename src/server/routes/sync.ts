import { Router } from "express"
import { ZodError } from "zod"
import type { ServerDeps } from "./deps"
import { SyncPupilSchema, SyncBatchSchema } from "../../api/schemas/index"
import { optionalAuth, requireAuthChain, type AuthenticatedRequest } from "../authMiddleware"
import { requireCloudSyncAuth, requireScope } from "../rbac"
import { ApiError, handleRouteError } from "../errors"
import { writeAuditLog } from "../auditLog"
import { deliverWebhook } from "../webhookDelivery"
import { zodFirstError } from "../validation"

export const createSyncRouter = (deps: ServerDeps) => {
  const router = Router()

  router.post("/sync", optionalAuth, requireCloudSyncAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const body = SyncPupilSchema.parse(req.body)

      if (req.auth?.allowedPupilIds?.length && !req.auth.allowedPupilIds.includes(body.id)) {
        return handleRouteError(res, new ApiError("FORBIDDEN", "Pupil ID not in this API key's allowed scope.", 403))
      }

      const updatedLeaderboard = await deps.db.syncPupil(
        {
          id: body.id,
          name: body.name,
          class_level: body.class_level,
          points: body.points,
          streak_count: body.streak_count,
          last_active_date: body.last_active_date,
          badges_earned: body.badges_earned,
          teacherId: req.auth?.uid,
          parentId: body.parentId,
          subject_stats: body.subject_stats,
        },
        body.delta_points || 0
      )

      await writeAuditLog({
        actorUid: req.auth?.uid || "anonymous",
        actorType: req.auth?.type || "firebase",
        action: "sync_pupil",
        resource: "pupils",
        resourceId: body.id,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        requestId: req.requestId,
        success: true,
        keyId: req.auth?.keyId,
      })

      deliverWebhook("pupil.synced", { pupilId: body.id, points: body.points }, req.auth?.uid || "anonymous")
      res.json({ success: true, serverLeaderboard: updatedLeaderboard, syncTime: Date.now() })
    } catch (err) {
      if (err instanceof ZodError) {
        return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
      }
      handleRouteError(res, err, "Failed to merge sync events.")
    }
  })

  router.post("/sync/batch", ...requireAuthChain, requireScope("pupils:write"), async (req: AuthenticatedRequest, res) => {
    try {
      const { pupils } = SyncBatchSchema.parse(req.body)

      if (req.auth!.allowedPupilIds?.length) {
        const denied = pupils.filter(p => !req.auth!.allowedPupilIds!.includes(p.id))
        if (denied.length) {
          return handleRouteError(res, new ApiError(
            "FORBIDDEN",
            `Pupil IDs not in this API key's allowed scope: ${denied.map(p => p.id).join(", ")}`,
            403,
          ))
        }
      }

      const results = await deps.db.syncPupilBatch(pupils, req.auth!.uid)

      await writeAuditLog({
        actorUid: req.auth!.uid,
        actorType: req.auth!.type,
        action: "sync_pupil_batch",
        resource: "pupils",
        resourceId: `batch:${pupils.length}`,
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        requestId: req.requestId,
        success: true,
        keyId: req.auth!.keyId,
      })

      res.json({ success: true, results })
    } catch (err) {
      if (err instanceof ZodError) {
        return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
      }
      handleRouteError(res, err, "Batch sync failed.")
    }
  })

  return router
}
