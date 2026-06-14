import { Router } from "express"
import crypto from "crypto"
import type { ServerDeps } from "./deps"
import { handleRouteError } from "../errors"

export const createQuestsRouter = (deps: ServerDeps) => {
  const router = Router()

  router.get("/quests", async (req, res) => {
    try {
      const classLevel = req.query.class_level as string | undefined
      const subject = req.query.subject as string | undefined
      const cursor = req.query.cursor as string | undefined
      const limitRaw = parseInt(req.query.limit as string, 10)
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50
      const page = await deps.db.getQuestsByFilter(classLevel, subject, cursor, limit)
      const etag = `"${crypto.createHash("sha1").update(JSON.stringify(page.quests)).digest("hex")}"`
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=60")
      res.setHeader("ETag", etag)
      if (req.headers["if-none-match"] === etag) return res.sendStatus(304)
      res.json(page)
    } catch (err) {
      handleRouteError(res, err, "Failed to grab quests list.")
    }
  })

  router.get("/quests/:id", async (req, res) => {
    try {
      const quests = await deps.db.getQuests()
      const quest = quests.find(q => q.id === req.params.id)
      if (!quest) {
        return res.status(404).json({ error: { code: "NOT_FOUND", message: "Quest not found." } })
      }
      res.json(quest)
    } catch (err) {
      handleRouteError(res, err, "Failed to fetch quest.")
    }
  })

  return router
}
