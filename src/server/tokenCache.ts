import crypto from "crypto"
import Redis from "ioredis"
import type { UserRole } from "../types"
import type { SubscriptionPlan } from "./authContext"
import { getFirestoreAdmin } from "./firebaseAdmin"

type CachedProfile = {
  uid: string
  role: UserRole
  subscriptionPlan: SubscriptionPlan
}

const memoryCache = new Map<string, { value: CachedProfile; expiresAt: number }>()
const TOKEN_TTL_SEC = 55 * 60

let redisClient: Redis | null = null

const getRedis = (): Redis | null => {
  const url = process.env.REDIS_URL
  if (!url) return null
  if (!redisClient) {
    redisClient = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: true })
    redisClient.connect().catch(() => {
      redisClient = null
    })
  }
  return redisClient
}

const cacheKey = (token: string) => `token_cache:${crypto.createHash("sha256").update(token).digest("hex")}`

export const getCachedProfile = async (token: string): Promise<CachedProfile | null> => {
  const key = cacheKey(token)
  const redis = getRedis()

  if (redis) {
    try {
      const raw = await redis.get(key)
      if (raw) return JSON.parse(raw) as CachedProfile
    } catch {
      /* fall through to memory */
    }
  }

  const mem = memoryCache.get(key)
  if (mem && mem.expiresAt > Date.now()) return mem.value
  return null
}

export const setCachedProfile = async (token: string, profile: CachedProfile): Promise<void> => {
  const key = cacheKey(token)
  const redis = getRedis()

  if (redis) {
    try {
      await redis.setex(key, TOKEN_TTL_SEC, JSON.stringify(profile))
      return
    } catch {
      /* fall through */
    }
  }

  memoryCache.set(key, { value: profile, expiresAt: Date.now() + TOKEN_TTL_SEC * 1000 })
}

export const loadUserProfile = async (uid: string): Promise<CachedProfile | null> => {
  const firestore = getFirestoreAdmin()
  if (!firestore) return null

  const snap = await firestore.collection("users").doc(uid).get()
  if (!snap.exists) return null

  const data = snap.data()!
  return {
    uid,
    role: data.role as UserRole,
    subscriptionPlan: (data.subscriptionPlan || "free") as SubscriptionPlan,
  }
}

export const loadUserProfileWithCache = async (token: string, uid: string): Promise<CachedProfile | null> => {
  const cached = await getCachedProfile(token)
  if (cached) return cached

  const profile = await loadUserProfile(uid)
  if (profile) await setCachedProfile(token, profile)
  return profile
}
