import { Router } from "express"
import { ZodError } from "zod"
import type { ServerDeps } from "./deps"
import { SholaChatSchema } from "../../api/schemas/index"
import { requireAuthChain, type AuthenticatedRequest } from "../authMiddleware"
import { sholaChat } from "../sholaChat"
import { sholaRateLimitAsync, setRateLimitHeaders } from "../rateLimiter"
import { ApiError, handleRouteError } from "../errors"
import { zodFirstError } from "../validation"

export const createSholaRouter = () => {
  const router = Router()

  router.post("/shola/chat", ...requireAuthChain, async (req: AuthenticatedRequest, res) => {
    try {
      const rateKey = req.auth!.keyId || req.auth!.uid
      const rate = await sholaRateLimitAsync(rateKey)
      setRateLimitHeaders(res, rate)
      if (!rate.allowed) {
        throw new ApiError("RATE_LIMITED", "Daily study limit reached. Come back tomorrow, star learner!", 429)
      }

      const { messages, class_level, questContext } = SholaChatSchema.parse(req.body)
      const normalizedMessages = messages.map(m => ({
        ...m,
        timestamp: m.timestamp || new Date().toISOString(),
      }))
      const result = await sholaChat(normalizedMessages, class_level, questContext, req.auth!.uid)
      res.json(result)
    } catch (err) {
      if (err instanceof ZodError) {
        return handleRouteError(res, new ApiError("VALIDATION_ERROR", zodFirstError(err), 400))
      }
      handleRouteError(res, err, "Shola is unavailable right now. Try again soon!")
    }
  })

  return router
}
