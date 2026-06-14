import { Request, Response, NextFunction } from "express"
import { verifyIdToken } from "./firebaseAdmin"
import { verifyApiKey } from "./apiKeyService"
import { loadUserProfileWithCache } from "./tokenCache"
import { ROLE_SCOPES, type AuthContext } from "./authContext"
import { ApiError, sendApiError } from "./errors"
import { createRedisRateLimiter, setRateLimitHeaders } from "./rateLimiter"

export interface AuthenticatedRequest extends Request {
  auth?: AuthContext
  requestId?: string
  /** @deprecated use req.auth.uid */
  firebaseUser?: { uid: string; email?: string }
}

const extractBearer = (req: Request): string | null => {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7)
  const apiKeyHeader = req.headers["x-ssa-api-key"]
  if (typeof apiKeyHeader === "string" && apiKeyHeader) return apiKeyHeader
  return null
}

const attachLegacyFirebaseUser = (req: AuthenticatedRequest) => {
  if (req.auth?.type === "firebase") {
    req.firebaseUser = { uid: req.auth.uid, email: req.auth.email }
  }
}

export const multiAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const credential = extractBearer(req)
  if (!credential) return next()

  try {
    if (credential.startsWith("ssa_live_")) {
      const record = await verifyApiKey(credential)
      if (!record) return next()

      const keyLimiter = createRedisRateLimiter(record.rateLimitPerHour, 60 * 60 * 1000, "global")
      const rateResult = await keyLimiter(`key:${record.id}`)
      setRateLimitHeaders(res, rateResult)
      if (!rateResult.allowed) {
        return sendApiError(res, new ApiError("RATE_LIMITED", "API key hourly rate limit exceeded.", 429))
      }

      req.auth = {
        type: "api_key",
        uid: record.ownerUid,
        scopes: record.scopes,
        keyId: record.id,
        ...(record.allowedPupilIds?.length ? { allowedPupilIds: record.allowedPupilIds } : {}),
      }
      return next()
    }

    const decoded = await verifyIdToken(credential)
    if (!decoded) return next()

    const profile = await loadUserProfileWithCache(credential, decoded.uid)
    req.auth = {
      type: "firebase",
      uid: decoded.uid,
      email: decoded.email,
      role: profile?.role,
      subscriptionPlan: profile?.subscriptionPlan,
      scopes: profile?.role ? ROLE_SCOPES[profile.role] : [],
    }
    attachLegacyFirebaseUser(req)
    next()
  } catch (err) {
    next(err)
  }
}

export const requireAuth = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  if (!req.auth) {
    return next(new ApiError("UNAUTHENTICATED", "Authentication required. Provide a Firebase ID token or API key.", 401))
  }
  attachLegacyFirebaseUser(req)
  next()
}

export const optionalAuth = multiAuth

export const requireAuthChain = [multiAuth, requireAuth]
