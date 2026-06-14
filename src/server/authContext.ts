import type { UserRole } from "../types"

export type SubscriptionPlan = "free" | "individual" | "team"

export interface AuthContext {
  type: "firebase" | "api_key"
  uid: string
  email?: string
  role?: UserRole
  subscriptionPlan?: SubscriptionPlan
  scopes: string[]
  keyId?: string
  /** API key pupil allow-list — when set, write operations are restricted to these IDs */
  allowedPupilIds?: string[]
}

export const ROLE_SCOPES: Record<UserRole, string[]> = {
  teacher: [
    "quests:read",
    "quests:write",
    "pupils:read",
    "pupils:write",
    "ai:generate",
    "invites:write",
    "teacher:*",
  ],
  parent: [
    "quests:read",
    "quests:write",
    "pupils:read",
    "pupils:write",
    "ai:generate",
    "invites:write",
    "parent:*",
  ],
  pupil: ["quests:read", "pupils:write"],
}

export const hasScope = (ctx: AuthContext, scope: string): boolean => {
  if (ctx.scopes.includes(scope)) return true
  const prefix = scope.split(":")[0]
  return ctx.scopes.includes(`${prefix}:*`) || ctx.scopes.includes("teacher:*") || ctx.scopes.includes("parent:*")
}

export const isPremium = (plan?: SubscriptionPlan): boolean =>
  plan === "individual" || plan === "team"
