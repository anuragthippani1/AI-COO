import { prisma } from './prisma'

/**
 * Cost & Rate Limit Guard
 * Tracks and limits AI usage per user
 */

const RATE_LIMITS = {
  FREE: {
    tokensPerDay: 10000,
    actionsPerDay: 50,
    aiCallsPerDay: 20,
  },
  PRO: {
    tokensPerDay: 100000,
    actionsPerDay: 500,
    aiCallsPerDay: 200,
  },
  AI_COO: {
    tokensPerDay: 1000000,
    actionsPerDay: 5000,
    aiCallsPerDay: 2000,
  },
}

/**
 * Check if user can perform action (rate limit check)
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @param {number} estimatedTokens - Estimated tokens for this action
 * @returns {Promise<{allowed: boolean, reason?: string, limits?: object}>}
 */
export async function checkRateLimit(userId, actionType, estimatedTokens = 0) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) {
      return { allowed: false, reason: 'User not found' }
    }

    const tier = user.subscription?.tier || 'FREE'
    const limits = RATE_LIMITS[tier] || RATE_LIMITS.FREE

    // Get today's usage
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // TODO: Create UsageTracking model in Prisma schema
    // For now, using ActivityLog as proxy
    const todayActions = await prisma.activityLog.count({
      where: {
        userId,
        createdAt: {
          gte: today,
        },
      },
    })

    // Check action limit
    if (todayActions >= limits.actionsPerDay) {
      return {
        allowed: false,
        reason: `Daily action limit reached (${limits.actionsPerDay}). Upgrade plan for higher limits.`,
        limits,
      }
    }

    // Check token limit (estimated)
    // TODO: Track actual tokens when UsageTracking model is created
    const estimatedDailyTokens = todayActions * 100 // Rough estimate
    if (estimatedDailyTokens + estimatedTokens > limits.tokensPerDay) {
      return {
        allowed: false,
        reason: `Daily token limit would be exceeded. Estimated: ${estimatedDailyTokens + estimatedTokens} / ${limits.tokensPerDay}`,
        limits,
      }
    }

    return {
      allowed: true,
      limits,
      remaining: {
        actions: limits.actionsPerDay - todayActions,
        tokens: limits.tokensPerDay - estimatedDailyTokens,
      },
    }
  } catch (error) {
    console.error('[CostGuard] Error checking rate limit:', error)
    // On error, allow but log
    return { allowed: true, error: error.message }
  }
}

/**
 * Record usage
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @param {number} tokensUsed - Tokens used
 */
export async function recordUsage(userId, actionType, tokensUsed = 0) {
  try {
    // TODO: Create UsageTracking model
    // For now, usage is tracked via ActivityLog
    // This will be enhanced when UsageTracking model is added
    return { recorded: true }
  } catch (error) {
    console.error('[CostGuard] Error recording usage:', error)
    return { recorded: false, error: error.message }
  }
}

/**
 * Get usage statistics for user
 * @param {string} userId - User ID
 * @param {string} period - Period (today, week, month)
 * @returns {Promise<object>}
 */
export async function getUsageStats(userId, period = 'today') {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    const tier = user?.subscription?.tier || 'FREE'
    const limits = RATE_LIMITS[tier] || RATE_LIMITS.FREE

    let startDate = new Date()
    if (period === 'today') {
      startDate.setHours(0, 0, 0, 0)
    } else if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7)
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1)
    }

    const actions = await prisma.activityLog.count({
      where: {
        userId,
        createdAt: {
          gte: startDate,
        },
      },
    })

    // Estimate tokens (rough calculation)
    const estimatedTokens = actions * 100

    return {
      period,
      actions,
      estimatedTokens,
      limits,
      usage: {
        actions: actions,
        tokens: estimatedTokens,
      },
      remaining: {
        actions: Math.max(0, limits.actionsPerDay - actions),
        tokens: Math.max(0, limits.tokensPerDay - estimatedTokens),
      },
      percentage: {
        actions: Math.min(100, (actions / limits.actionsPerDay) * 100),
        tokens: Math.min(100, (estimatedTokens / limits.tokensPerDay) * 100),
      },
    }
  } catch (error) {
    console.error('[CostGuard] Error getting usage stats:', error)
    return {
      period,
      actions: 0,
      estimatedTokens: 0,
      limits: RATE_LIMITS.FREE,
      error: error.message,
    }
  }
}

/**
 * Reset usage counters (admin function)
 * @param {string} userId - User ID
 * @returns {Promise<{success: boolean}>}
 */
export async function resetUsage(userId) {
  try {
    // TODO: Implement when UsageTracking model is created
    return { success: true }
  } catch (error) {
    console.error('[CostGuard] Error resetting usage:', error)
    return { success: false, error: error.message }
  }
}

