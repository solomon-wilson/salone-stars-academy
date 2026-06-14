import { Router } from "express"
import { ZodError } from "zod"
import type { ServerDeps } from "./deps"
import { CheckoutSchema, CreateApiKeySchema } from "../../api/schemas/index"
import { requireAuthChain, type AuthenticatedRequest } from "../authMiddleware"
import { createApiKey, listApiKeys, revokeApiKey, rotateApiKey } from "../apiKeyService"
import { ApiError, handleRouteError } from "../errors"
import { writeAuditLog } from "../auditLog"
import { processBillingSuccessRedirect } from "../billingService"
import { zodFirstError } from "../validation"

export const createKeysRouter = () => {
  const router = Router()

  router.post("/keys", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const input = CreateApiKeySchema.parse(req.body)
      const result = await createApiKey(req.auth!.uid, input.name, input.scopes, input.rateLimitPerHour)

      await writeAuditLog({
        actorUid: req.auth!.uid,
        actorType: req.auth!.type,
        action: "create_api_key",
        resource: "api_keys",
        resourceId: result.keyId,
        ip: req.ip,
        success: true,
      })

      res.status(201).json({
        keyId: result.keyId,
        prefix: result.prefix,
        secret: result.secret,
        warning: "Store the secret now — it will not be shown again.",
      })
    } catch (err) {
      if (err instanceof ZodError) {
        return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
      }
      handleRouteError(res, err, "Failed to create API key.")
    }
  })

  router.get("/keys", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const keys = await listApiKeys(req.auth!.uid)
      res.json({ keys })
    } catch (err) {
      handleRouteError(res, err, "Failed to list API keys.")
    }
  })

  router.delete("/keys/:keyId", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const ok = await revokeApiKey(req.auth!.uid, req.params.keyId)
      if (!ok) throw new ApiError("NOT_FOUND", "API key not found.", 404)

      await writeAuditLog({
        actorUid: req.auth!.uid,
        actorType: req.auth!.type,
        action: "revoke_api_key",
        resource: "api_keys",
        resourceId: req.params.keyId,
        ip: req.ip,
        success: true,
      })

      res.json({ success: true })
    } catch (err) {
      handleRouteError(res, err, "Failed to revoke API key.")
    }
  })

  router.post("/keys/:keyId/rotate", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const result = await rotateApiKey(req.auth!.uid, req.params.keyId)
      if (!result) throw new ApiError("NOT_FOUND", "API key not found.", 404)

      await writeAuditLog({
        actorUid: req.auth!.uid,
        actorType: req.auth!.type,
        action: "rotate_api_key",
        resource: "api_keys",
        resourceId: req.params.keyId,
        ip: req.ip,
        success: true,
      })

      res.status(201).json({
        keyId: result.keyId,
        prefix: result.prefix,
        secret: result.secret,
        warning: "Old key is revoked immediately. Store the new secret — it will not be shown again.",
      })
    } catch (err) {
      handleRouteError(res, err, "Failed to rotate API key.")
    }
  })

  return router
}

export const createBillingRouter = (deps: ServerDeps) => {
  const router = Router()

  router.post("/billing/checkout", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const { userId, planName, email, subscriberRole } = CheckoutSchema.parse(req.body)
      if (req.auth!.uid !== userId) {
        throw new ApiError("FORBIDDEN", "Cannot checkout for another user.", 403)
      }

      const host = req.get("host")
      const protocol = req.protocol
      const origin = `${protocol}://${host}`

      const stripe = deps.getStripe()
      if (!stripe) {
        const sandboxUrl = `${origin}/_mock-payment?userId=${encodeURIComponent(userId)}&plan=${encodeURIComponent(planName)}`
        return res.json({ url: sandboxUrl, simulated: true })
      }

      const role = subscriberRole === "parent" ? "parent" : "teacher"
      const amount = planName === "team" ? 9999 : 1999
      const displayTitle = planName === "team"
        ? "SSA Team Plan (School Owners)"
        : role === "parent"
          ? "SSA Individual Plan (Home Tutor Replacement)"
          : "SSA Individual Plan (Private Lesson Toolkit)"
      const description = planName === "team"
        ? "Monthly team access for schools with up to 25 teacher licenses."
        : role === "parent"
          ? "Home learning support — daily MBSSE-aligned practice for your child."
          : "Monthly access for private teachers with custom curriculum and AI quests."

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: displayTitle, description },
            unit_amount: amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        }],
        mode: "subscription",
        client_reference_id: userId,
        metadata: { userId, plan: planName, subscriberRole: role },
        success_url: `${origin}/api/billing/success?userId=${encodeURIComponent(userId)}&plan=${encodeURIComponent(planName)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?billing-cancelled=true`,
        customer_email: email,
      })

      res.json({ url: session.url, simulated: false })
    } catch (err) {
      if (err instanceof ZodError) {
        return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
      }
      handleRouteError(res, err, "Failed to launch payment checkout portal.")
    }
  })

  router.get("/billing/success", async (req, res) => {
    try {
      const userId = req.query.userId as string
      const plan = req.query.plan as string
      const sessionId = req.query.session_id as string | undefined

      if (userId && plan) {
        await processBillingSuccessRedirect(userId, plan, sessionId, deps.getStripe())
      }
      res.redirect(`/?billing-success=true&plan=${encodeURIComponent(plan || "")}&userId=${encodeURIComponent(userId || "")}`)
    } catch {
      res.redirect("/?billing-error=true")
    }
  })

  return router
}
