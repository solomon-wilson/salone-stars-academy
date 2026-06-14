type RateLimitEntry = { count: number; resetAt: number }

const memoryStore = new Map<string, RateLimitEntry>()

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number; limit: number }

export const setRateLimitHeaders = (
  res: { setHeader(name: string, value: string | number): void },
  result: RateLimitResult
) => {
  res.setHeader("X-RateLimit-Limit", result.limit)
  res.setHeader("X-RateLimit-Remaining", result.remaining)
  res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetAt / 1000))
  if (!result.allowed) res.setHeader("Retry-After", Math.ceil((result.resetAt - Date.now()) / 1000))
}

const memoryCheck = (key: string, maxRequests: number, windowMs: number): RateLimitResult => {
  const now = Date.now()
  const entry = memoryStore.get(key)

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    memoryStore.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: maxRequests - 1, resetAt, limit: maxRequests }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, limit: maxRequests }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt, limit: maxRequests }
}

export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  return (key: string): boolean => memoryCheck(key, maxRequests, windowMs).allowed
}

export const createRedisRateLimiter = (maxRequests: number, windowMs: number, action: string) => {
  return async (principal: string): Promise<RateLimitResult> => {
    const key = `rate:${principal}:${action}`
    const redisUrl = process.env.REDIS_URL

    if (redisUrl) {
      try {
        const Redis = (await import("ioredis")).default
        const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, lazyConnect: true })
        await redis.connect()

        const windowSec = Math.ceil(windowMs / 1000)
        const count = await redis.incr(key)
        if (count === 1) await redis.expire(key, windowSec)

        const ttl = await redis.ttl(key)
        const resetAt = Date.now() + ttl * 1000
        await redis.quit()

        if (count > maxRequests) {
          return { allowed: false, remaining: 0, resetAt, limit: maxRequests }
        }
        return { allowed: true, remaining: maxRequests - count, resetAt, limit: maxRequests }
      } catch {
        /* fall through to memory */
      }
    }

    return memoryCheck(key, maxRequests, windowMs)
  }
}

export const geminiRateLimiter = createRateLimiter(10, 60 * 60 * 1000)
export const parentHomeworkRateLimiter = createRateLimiter(5, 24 * 60 * 60 * 1000)
export const sholaRateLimiter = createRateLimiter(50, 24 * 60 * 60 * 1000)

export const geminiRateLimitAsync = createRedisRateLimiter(10, 60 * 60 * 1000, "generate-quest")
export const parentHomeworkRateLimitAsync = createRedisRateLimiter(5, 24 * 60 * 60 * 1000, "generate-homework")
export const sholaRateLimitAsync = createRedisRateLimiter(50, 24 * 60 * 60 * 1000, "shola-chat")
