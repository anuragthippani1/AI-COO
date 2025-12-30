// Rate limiting utility
// Uses in-memory store for simplicity (use Redis in production)

const rateLimitStore = new Map()

export function createRateLimiter(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // max requests per window
    keyGenerator = (req) => req.headers.get('x-forwarded-for') || 'unknown',
    skipSuccessfulRequests = false,
  } = options

  return async (req) => {
    const key = keyGenerator(req)
    const now = Date.now()
    const windowStart = now - windowMs

    // Clean up old entries
    if (rateLimitStore.size > 10000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (v.resetTime < now) {
          rateLimitStore.delete(k)
        }
      }
    }

    // Get or create rate limit entry
    let entry = rateLimitStore.get(key)
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      }
      rateLimitStore.set(key, entry)
    }

    // Check limit
    if (entry.count >= max) {
      return {
        success: false,
        limit: max,
        remaining: 0,
        resetTime: entry.resetTime,
      }
    }

    // Increment count
    entry.count++

    return {
      success: true,
      limit: max,
      remaining: max - entry.count,
      resetTime: entry.resetTime,
    }
  }
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
})

export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI requests per minute
})

export const emailRateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 emails per hour
})

export const generalRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
})




