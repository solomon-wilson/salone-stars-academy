type RateLimitEntry = { count: number; resetAt: number }

const store = new Map<string, RateLimitEntry>()

export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  return (key: string): boolean => {
    const now = Date.now()
    const entry = store.get(key)

    if (!entry || now > entry.resetAt) {
      store.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }

    if (entry.count >= maxRequests) return false
    entry.count++
    return true
  }
}

export const geminiRateLimiter = createRateLimiter(10, 60 * 60 * 1000)
export const parentHomeworkRateLimiter = createRateLimiter(5, 24 * 60 * 60 * 1000)
