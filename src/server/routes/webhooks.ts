import crypto from "crypto"
import { Router } from "express"
import { ZodError } from "zod"
import { WebhookCreateSchema } from "../../api/schemas/index"
import { requireAuthChain, type AuthenticatedRequest } from "../authMiddleware"
import { ApiError, handleRouteError } from "../errors"
import { getFirestoreAdmin } from "../firebaseAdmin"
import { zodFirstError } from "../validation"

export const createWebhooksRouter = () => {
  const router = Router()

  router.post("/webhooks", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const { url, events } = WebhookCreateSchema.parse(req.body)
      const firestore = getFirestoreAdmin()
      if (!firestore) throw new ApiError("INTERNAL", "Webhooks require Firestore (cloud mode).", 503)

      const id = crypto.randomUUID()
      const secret = `whsec_${crypto.randomBytes(24).toString("base64url")}`
      const record = {
        id,
        ownerUid: req.auth!.uid,
        url,
        events,
        secret,
        active: true,
        createdAt: new Date().toISOString(),
      }
      await firestore.collection("webhooks").doc(id).set(record)

      res.status(201).json({
        id,
        url,
        events,
        secret,
        warning: "Store this secret securely — it will not be shown again.",
      })
    } catch (err) {
      if (err instanceof ZodError) {
        return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
      }
      handleRouteError(res, err, "Failed to register webhook.")
    }
  })

  router.get("/webhooks", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const firestore = getFirestoreAdmin()
      if (!firestore) throw new ApiError("INTERNAL", "Webhooks require Firestore (cloud mode).", 503)

      const snap = await firestore
        .collection("webhooks")
        .where("ownerUid", "==", req.auth!.uid)
        .get()

      const webhooks = snap.docs.map(d => {
        const { secret: _, ...rest } = d.data()
        return rest
      })
      res.json(webhooks)
    } catch (err) {
      handleRouteError(res, err, "Failed to list webhooks.")
    }
  })

  router.delete("/webhooks/:webhookId", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const firestore = getFirestoreAdmin()
      if (!firestore) throw new ApiError("INTERNAL", "Webhooks require Firestore (cloud mode).", 503)

      const ref = firestore.collection("webhooks").doc(req.params.webhookId)
      const snap = await ref.get()
      if (!snap.exists || snap.data()?.ownerUid !== req.auth!.uid) {
        throw new ApiError("NOT_FOUND", "Webhook not found.", 404)
      }
      await ref.update({ active: false })
      res.json({ success: true })
    } catch (err) {
      handleRouteError(res, err, "Failed to delete webhook.")
    }
  })

  return router
}
