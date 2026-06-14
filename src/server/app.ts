import express, { type Express, type Request } from "express"
import crypto from "crypto"
import Stripe from "stripe"
import { DatabaseManager } from "../dbManager"
import { multiAuth } from "./authMiddleware"
import { ApiError, sendApiError } from "./errors"
import { createHealthRouter } from "./routes/health"
import { createQuestsRouter } from "./routes/quests"
import { createSyncRouter } from "./routes/sync"
import { createTeacherRouter } from "./routes/teacher"
import { createParentRouter } from "./routes/parent"
import { createSholaRouter } from "./routes/shola"
import { createKeysRouter, createBillingRouter } from "./routes/billing"
import { createWebhooksRouter } from "./routes/webhooks"
import { createDocsRouter } from "./routes/docs"
import { deprecationMiddleware } from "./routes/legacy"
import type { ServerDeps } from "./routes/deps"
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handlePaymentFailed,
} from "./billingService"

let stripeClient: Stripe | null = null

export const getStripe = (): Stripe | null => {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" as any })
  }
  return stripeClient
}

export const createApp = (): Express => {
  const app = express()
  const db = DatabaseManager.getInstance()
  const deps: ServerDeps = { db, getStripe }

  const appUrl = process.env.APP_URL || "*"
  const integrationOrigins = (process.env.INTEGRATION_ORIGINS || "")
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)

  app.use((req: Request & { requestId?: string }, res, next) => {
    const id = (req.headers["x-request-id"] as string) || crypto.randomUUID()
    req.requestId = id
    res.setHeader("X-Request-ID", id)
    next()
  })

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff")
    res.setHeader("X-XSS-Protection", "1; mode=block")
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
    }

    const origin = req.headers.origin
    if (origin && (origin === appUrl || integrationOrigins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin)
    } else if (appUrl === "*") {
      res.setHeader("Access-Control-Allow-Origin", "*")
    } else {
      res.setHeader("Access-Control-Allow-Origin", appUrl)
    }

    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-SSA-Api-Key")
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
    if (req.method === "OPTIONS") return res.sendStatus(204)
    next()
  })

  app.post(
    "/api/billing/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const stripe = getStripe()
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
      if (!stripe || !webhookSecret) {
        return res.status(503).json({ error: { code: "INTERNAL", message: "Webhook not configured" } })
      }

      const sig = req.headers["stripe-signature"] as string
      try {
        const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
        switch (event.type) {
          case "checkout.session.completed":
            await handleCheckoutCompleted(stripe, event.data.object as Stripe.Checkout.Session)
            break
          case "customer.subscription.deleted":
            await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
            break
          case "invoice.payment_failed":
            await handlePaymentFailed(event.data.object as Stripe.Invoice)
            break
          default:
            break
        }
        res.json({ received: true })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Webhook error"
        console.error("[Stripe Webhook] Error:", message)
        res.status(400).json({ error: { code: "VALIDATION_ERROR", message: `Webhook Error: ${message}` } })
      }
    }
  )

  app.use(express.json())
  app.use(multiAuth)

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "salone-stars-academy",
      deploymentMode: db.getDeploymentMode(),
      timestamp: Date.now(),
    })
  })

  const v1 = express.Router()
  v1.use(createHealthRouter(deps))
  v1.use(createQuestsRouter(deps))
  v1.use(createSyncRouter(deps))
  v1.use(createTeacherRouter(deps))
  v1.use(createParentRouter(deps))
  v1.use(createSholaRouter())
  v1.use(createKeysRouter())
  v1.use(createBillingRouter(deps))
  v1.use(createWebhooksRouter())
  app.use("/api/v1", v1)
  app.use("/api", deprecationMiddleware, v1)

  app.use(createDocsRouter())

  app.get("/_mock-payment", (req, res) => {
    const userId = req.query.userId as string
    const plan = req.query.plan as string
    res.send(`
      <html>
        <head><title>Salone Stars Sandbox Charging Node</title></head>
        <body style="font-family:sans-serif;text-align:center;padding:40px">
          <h2>Sandbox Payment Portal</h2>
          <p>Plan: ${plan === "team" ? "Team" : "Individual"}</p>
          <a href="/api/billing/success?userId=${encodeURIComponent(userId || "")}&plan=${encodeURIComponent(plan || "")}">Authorize Sandbox payment</a>
        </body>
      </html>
    `)
  })

  app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof ApiError) return sendApiError(res, err)
    next(err)
  })

  return app
}
