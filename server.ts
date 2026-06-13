import express from "express"
import path from "path"
import dotenv from "dotenv"
import { GoogleGenAI, Type } from "@google/genai"
import Stripe from "stripe"
import { DatabaseManager, Quest } from "./src/dbManager"
import { requireAuth, optionalAuth, AuthenticatedRequest } from "./src/server/authMiddleware"
import { geminiRateLimiter, parentHomeworkRateLimiter } from "./src/server/rateLimiter"
import {
  handleCheckoutCompleted,
  handleSubscriptionDeleted,
  handlePaymentFailed,
  processBillingSuccessRedirect,
} from "./src/server/billingService"

dotenv.config()

const app = express()
const PORT = 3000
const db = DatabaseManager.getInstance()

const allowedOrigin = process.env.APP_URL || "*"

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-XSS-Protection", "1; mode=block")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Access-Control-Allow-Origin", allowedOrigin)
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  if (req.method === "OPTIONS") return res.sendStatus(204)
  next()
})

// Stripe webhook needs raw body — register before express.json()
app.post(
  "/api/billing/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = getStripe()
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!stripe || !webhookSecret) {
      return res.status(503).json({ error: "Webhook not configured" })
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
    } catch (err: any) {
      console.error("[Stripe Webhook] Error:", err.message)
      res.status(400).json({ error: `Webhook Error: ${err.message}` })
    }
  }
)

app.use(express.json())

let stripeClient: Stripe | null = null
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) return null
  if (!stripeClient) {
    stripeClient = new Stripe(key, { apiVersion: "2023-10-16" as any })
  }
  return stripeClient
}

let geminiAI: GoogleGenAI | null = null
function getGemini(): GoogleGenAI {
  if (!geminiAI) {
    const key = process.env.GEMINI_API_KEY
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required to generate AI quests.")
    }
    geminiAI = new GoogleGenAI({
      apiKey: key,
      httpOptions: { headers: { "User-Agent": "aistudio-build" } },
    })
  }
  return geminiAI
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "salone-stars-academy",
    deploymentMode: db.getDeploymentMode(),
    timestamp: Date.now(),
  })
})

app.get("/api/quests", async (_req, res) => {
  try {
    res.json(await db.getQuests())
  } catch {
    res.status(500).json({ error: "Failed to grab quests list." })
  }
})

app.post("/api/sync", optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { id, name, class_level, points, streak_count, last_active_date, badges_earned, delta_points, parentId } = req.body
    if (!id || !name) {
      return res.status(400).json({ error: "Pupil ID and Name are required for sync." })
    }

    const updatedLeaderboard = await db.syncPupil(
      {
        id,
        name,
        class_level,
        points,
        streak_count,
        last_active_date,
        badges_earned,
        teacherId: req.firebaseUser?.uid,
        parentId: parentId || undefined,
      },
      delta_points || 0
    )

    res.json({ success: true, serverLeaderboard: updatedLeaderboard, syncTime: Date.now() })
  } catch {
    res.status(500).json({ error: "Failed to merge sync events." })
  }
})

app.get("/api/teacher/students", requireAuth, async (_req, res) => {
  try {
    res.json(await db.getStudentsAndLogs())
  } catch {
    res.status(500).json({ error: "Failed to fetch student statistics." })
  }
})

app.post("/api/billing/checkout", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { userId, planName, email, subscriberRole } = req.body
    if (!userId || !planName) {
      return res.status(400).json({ error: "Missing required checkout parameters." })
    }
    if (req.firebaseUser?.uid !== userId) {
      return res.status(403).json({ error: "Cannot checkout for another user." })
    }

    const host = req.get("host")
    const protocol = req.protocol
    const origin = `${protocol}://${host}`

    const stripe = getStripe()
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
          product_data: {
            name: displayTitle,
            description,
          },
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
  } catch (err: any) {
    res.status(500).json({ error: err.message || "Failed to launch payment checkout portal." })
  }
})

app.get("/api/billing/success", async (req, res) => {
  try {
    const userId = req.query.userId as string
    const plan = req.query.plan as string
    const sessionId = req.query.session_id as string | undefined

    if (userId && plan) {
      await processBillingSuccessRedirect(userId, plan, sessionId, getStripe())
    }
    res.redirect(`/?billing-success=true&plan=${encodeURIComponent(plan || "")}&userId=${encodeURIComponent(userId || "")}`)
  } catch {
    res.redirect("/?billing-error=true")
  }
})

app.get("/_mock-payment", (req, res) => {
  const userId = req.query.userId as string
  const plan = req.query.plan as string
  res.send(`
    <html>
      <head>
        <title>Salone Stars Sandbox Charging Node</title>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap" rel="stylesheet" />
        <style>
          body { background: #05060f; color: #fff; font-family: 'Poppins', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
          .card { background: #0f1233; border: 1px solid #6366f1; padding: 40px; border-radius: 24px; text-align: center; max-width: 440px; box-shadow: 0 10px 30px rgba(99,102,241,0.2); }
          h2 { font-weight: 800; color: #818cf8; margin-top: 0; }
          p { color: #a5b4fc; font-size: 14px; line-height: 1.6; }
          .btn { background: linear-gradient(90deg, #7c3aed, #2563eb); color: white; border: none; padding: 12px 30px; font-weight: bold; border-radius: 12px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 24px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Sandbox Payment Portal</h2>
          <p>You have selected the <strong>${plan === "team" ? "Team ($99.99/mo)" : "Individual ($19.99/mo)"}</strong> package.</p>
          <p>Complete this simulated payment to activate your premium plan.</p>
          <a class="btn" href="/api/billing/success?userId=${encodeURIComponent(userId || "")}&plan=${encodeURIComponent(plan || "")}">Authorize Sandbox payment</a>
        </div>
      </body>
    </html>
  `)
})

app.post("/api/teacher/publish-quest", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const newQuest = req.body
    if (!newQuest.title || !newQuest.subject || !newQuest.class_level || !newQuest.questions?.length) {
      return res.status(400).json({ error: "Invalid quest data structure." })
    }
    const questWithMeta: Quest = {
      ...newQuest,
      id: newQuest.id || `q-pub-${Math.random().toString(36).substring(2, 9)}`,
      source: "generated",
      teacherId: req.firebaseUser?.uid,
    }
    await db.publishQuest(questWithMeta)
    res.json({ success: true, quest: questWithMeta })
  } catch {
    res.status(500).json({ error: "Failed to publish quest to catalog." })
  }
})

app.post("/api/teacher/generate-quest", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rateKey = req.firebaseUser?.uid || req.ip || "anonymous"
    if (!geminiRateLimiter(rateKey)) {
      return res.status(429).json({ error: "Rate limit exceeded. Max 10 generations per hour." })
    }

    const { subject, class_level, customTopic } = req.body
    if (!subject || !class_level) {
      return res.status(400).json({ error: "Subject and Class Level are required parameters." })
    }

    const ai = getGemini()
    const prompt = `Create a realistic K-12 primary school quest for Sierra Leone's MBSSE National Syllabus.
      Parameters:
      - Subject: ${subject}
      - Class/Level: ${class_level}
      - Customized Theme / Local Reference: ${customTopic || "Local Sierra Leonean daily activities"}
      
      Requirements for the 2 questions:
      - Questions must be culturally relevant representing Sierra Leone context.
      - Include immediate pedagogical explanations.
      - Each question needs a 'krioInstruction' in Sierra Leonean Krio.

      Generate clean structured JSON adhering strictly to the response schema.`

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "points_award", "difficulty", "questions"],
          properties: {
            title: { type: Type.STRING },
            points_award: { type: Type.INTEGER },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["questionText", "options", "correctOption", "explanation", "krioInstruction"],
                properties: {
                  questionText: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctOption: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  krioInstruction: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    })

    const outputText = response.text
    if (!outputText) throw new Error("No text output received from AI.")
    res.json(JSON.parse(outputText.trim()))
  } catch (error: any) {
    console.error("Gemini Generation Error:", error)
    res.status(500).json({ error: error.message || "Failed to generate AI curricular quest." })
  }
})

app.post("/api/parent/generate-homework", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const rateKey = `parent-${req.firebaseUser?.uid || req.ip}`
    if (!parentHomeworkRateLimiter(rateKey)) {
      return res.status(429).json({ error: "Rate limit exceeded. Max 5 homework generations per day." })
    }

    const { pupilId, class_level, topics, subject } = req.body
    if (!pupilId || !class_level || !topics) {
      return res.status(400).json({ error: "pupilId, class_level, and topics are required." })
    }
    if (typeof topics !== "string" || topics.length > 500) {
      return res.status(400).json({ error: "topics must be a string of 500 characters or fewer." })
    }

    const ai = getGemini()
    const prompt = `Create a realistic K-12 primary school homework quest for Sierra Leone's MBSSE National Syllabus.
      Parameters:
      - Subject: ${subject || "Mixed"}
      - Class/Level: ${class_level}
      - Parent weekly topic note: ${topics}
      
      Requirements for exactly 2 questions:
      - Align with the parent's weekly topic note.
      - Culturally relevant Sierra Leone context.
      - Include pedagogical explanations.
      - Each question needs a 'krioInstruction' in Sierra Leonean Krio.
      - Reject gibberish topics; if topics are nonsense, use general MBSSE ${class_level} revision instead.

      Generate clean structured JSON adhering strictly to the response schema.`

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["title", "points_award", "difficulty", "questions"],
          properties: {
            title: { type: Type.STRING },
            points_award: { type: Type.INTEGER },
            difficulty: { type: Type.STRING },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["questionText", "options", "correctOption", "explanation", "krioInstruction"],
                properties: {
                  questionText: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctOption: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  krioInstruction: { type: Type.STRING },
                },
              },
            },
          },
        },
      },
    })

    const outputText = response.text
    if (!outputText) throw new Error("No text output received from AI.")
    const draft = JSON.parse(outputText.trim())
    res.json({
      ...draft,
      subject: subject || "Mixed",
      class_level,
      pupilId,
    })
  } catch (error: any) {
    console.error("Parent homework generation error:", error)
    res.status(500).json({ error: error.message || "Failed to generate homework quest." })
  }
})

app.post("/api/parent/publish-homework", requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const newQuest = req.body
    if (!newQuest.title || !newQuest.class_level || !newQuest.questions?.length) {
      return res.status(400).json({ error: "Invalid homework quest structure." })
    }
    const questWithMeta: Quest = {
      ...newQuest,
      id: newQuest.id || `q-home-${Math.random().toString(36).substring(2, 9)}`,
      subject: newQuest.subject || "Mixed",
      source: "generated",
      teacherId: req.firebaseUser?.uid,
    }
    await db.publishQuest(questWithMeta)
    res.json({ success: true, quest: questWithMeta })
  } catch {
    res.status(500).json({ error: "Failed to publish homework quest." })
  }
})

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite")
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), "dist")
    app.use("/assets", express.static(path.join(distPath, "assets"), {
      maxAge: "365d",
      immutable: true,
      fallthrough: false,
    }))
    app.get("/manifest.json", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      res.sendFile(path.join(distPath, "manifest.json"))
    })
    app.get("/sw.js", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
      res.sendFile(path.join(distPath, "sw.js"))
    })
    app.use(express.static(distPath, { maxAge: "1d" }))
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"))
    })
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Salone Stars Academy server started on http://localhost:${PORT}`)
  })
}

export { app }

if (!process.env.VERCEL) {
  startServer()
}
