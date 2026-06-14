import { Router } from "express"
import type { ServerDeps } from "./deps"

export const createHealthRouter = (_deps: ServerDeps) => {
  const router = Router()

  router.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      service: "salone-stars-academy",
      deploymentMode: _deps.db.getDeploymentMode(),
      timestamp: Date.now(),
    })
  })

  return router
}
