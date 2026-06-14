import { Response, NextFunction } from "express"
import type { UserRole } from "../types"
import { DatabaseManager } from "../dbManager"
import { MAX_PARENT_CHILDREN } from "../constants/parent"
import { hasScope, isPremium, type AuthContext } from "./authContext"
import { ApiError } from "./errors"
import type { AuthenticatedRequest } from "./authMiddleware"
import { countParentLinkedChildren, isPupilLinkedToParent, isPupilOwnedByTeacher } from "./apiKeyService"

export const requireScope = (...scopes: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new ApiError("UNAUTHENTICATED", "Authentication required.", 401))
    if (scopes.some(s => hasScope(req.auth!, s))) return next()
    return next(new ApiError("FORBIDDEN", `Missing required scope: ${scopes.join(" or ")}`, 403))
  }
}

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    if (!req.auth) return next(new ApiError("UNAUTHENTICATED", "Authentication required.", 401))

    const roleMatch = req.auth.role && roles.includes(req.auth.role)
    const scopeMatch = roles.some(r => hasScope(req.auth!, `${r}:*`))

    if (roleMatch || scopeMatch) return next()
    return next(new ApiError("FORBIDDEN", `Requires role: ${roles.join(" or ")}`, 403))
  }
}

export const requirePremium = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  if (!req.auth) return next(new ApiError("UNAUTHENTICATED", "Authentication required.", 401))
  if (isPremium(req.auth.subscriptionPlan)) return next()
  return next(new ApiError("FORBIDDEN", "Premium subscription required for this action.", 403))
}

export const requireCloudSyncAuth = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const mode = DatabaseManager.getInstance().getDeploymentMode()
  if (mode === "pi") return next()

  if (!req.auth) {
    return next(new ApiError("UNAUTHENTICATED", "Authentication required for sync in cloud/hybrid mode.", 401))
  }
  next()
}

export const validateParentChildLink = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  if (!req.auth) return next(new ApiError("UNAUTHENTICATED", "Authentication required.", 401))

  const count = await countParentLinkedChildren(req.auth.uid)
  if (count >= MAX_PARENT_CHILDREN) {
    return next(new ApiError("FORBIDDEN", `Maximum ${MAX_PARENT_CHILDREN} linked children per parent account.`, 403))
  }
  next()
}

export const validateHomeworkPupil = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const pupilId = req.body?.pupilId as string | undefined
  if (!pupilId || !req.auth) return next()

  const linked = await isPupilLinkedToParent(req.auth.uid, pupilId)
  if (!linked) {
    return next(new ApiError("FORBIDDEN", "pupilId is not linked to this parent account.", 403))
  }
  next()
}

export const validateTeacherPupilInvite = async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  const pupilId = req.body?.pupilId as string | undefined
  if (!pupilId || !req.auth) return next()

  const owned = await isPupilOwnedByTeacher(req.auth.uid, pupilId)
  if (!owned) {
    return next(new ApiError("FORBIDDEN", "pupilId does not belong to this teacher.", 403))
  }
  next()
}

export const assertApiKeyPupilScope = (auth: AuthContext, pupilId: string) => {
  if (auth.type !== "api_key") return
  if (!auth.scopes.includes("pupils:write") && !auth.scopes.includes("pupils:read")) {
    throw new ApiError("FORBIDDEN", "API key lacks pupils scope.", 403)
  }
}
