import { prisma } from '@/lib/prisma'

/**
 * Autonomy Safety Guard
 * Monitors and controls autonomous AI actions for safety
 */

const SAFETY_THRESHOLDS = {
  maxFailures: 3, // Pause autonomy after 3 consecutive failures
  maxRejections: 5, // Lower autonomy after 5 user rejections
  minConfidence: 50, // Force approval if confidence < 50
  cooldownPeriod: 3600000, // 1 hour cooldown after failures
}

/**
 * Check if autonomy should be paused
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @returns {Promise<{shouldPause: boolean, reason?: string}>}
 */
export async function shouldPauseAutonomy(userId, actionType) {
  try {
    // Check for consecutive failures
    const recentFailures = await getRecentFailures(userId, actionType)
    if (recentFailures >= SAFETY_THRESHOLDS.maxFailures) {
      return {
        shouldPause: true,
        reason: `Too many consecutive failures (${recentFailures}). Autonomy paused for safety.`,
      }
    }

    // Check for user rejections
    const recentRejections = await getRecentRejections(userId)
    if (recentRejections >= SAFETY_THRESHOLDS.maxRejections) {
      return {
        shouldPause: true,
        reason: `Too many user rejections (${recentRejections}). Autonomy level reduced.`,
      }
    }

    // Check if in cooldown period
    const lastFailure = await getLastFailureTime(userId, actionType)
    if (lastFailure) {
      const timeSinceFailure = Date.now() - lastFailure.getTime()
      if (timeSinceFailure < SAFETY_THRESHOLDS.cooldownPeriod) {
        return {
          shouldPause: true,
          reason: `In cooldown period after recent failure. ${Math.ceil((SAFETY_THRESHOLDS.cooldownPeriod - timeSinceFailure) / 60000)} minutes remaining.`,
        }
      }
    }

    return { shouldPause: false }
  } catch (error) {
    console.error('[SafetyGuard] Error checking pause status:', error)
    // On error, pause for safety
    return {
      shouldPause: true,
      reason: 'Error checking safety status',
    }
  }
}

/**
 * Record a failed action
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @param {string} error - Error message
 */
export async function recordFailure(userId, actionType, error) {
  try {
    // TODO: Store in ActivityLog when created
    // For now, using Notification as temporary storage
    await prisma.notification.create({
      data: {
        userId,
        type: 'error',
        title: `Action Failed: ${actionType}`,
        message: error || 'Action execution failed',
        metadata: {
          actionType,
          error: error || 'Unknown error',
          timestamp: new Date().toISOString(),
          failure: true,
        },
        read: false,
      },
    })
  } catch (err) {
    console.error('[SafetyGuard] Error recording failure:', err)
  }
}

/**
 * Record a user rejection
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @param {string} reason - Rejection reason
 */
export async function recordRejection(userId, actionType, reason) {
  try {
    // TODO: Store in ActivityLog when created
    await prisma.notification.create({
      data: {
        userId,
        type: 'info',
        title: `Action Rejected: ${actionType}`,
        message: reason || 'User rejected AI action',
        metadata: {
          actionType,
          rejectionReason: reason,
          timestamp: new Date().toISOString(),
          rejection: true,
        },
        read: false,
      },
    })
  } catch (err) {
    console.error('[SafetyGuard] Error recording rejection:', err)
  }
}

/**
 * Check if action requires approval based on confidence
 * @param {number} confidenceScore - Confidence score (0-100)
 * @returns {boolean}
 */
export function requiresApprovalForConfidence(confidenceScore) {
  return confidenceScore < SAFETY_THRESHOLDS.minConfidence
}

/**
 * Get recent failures count
 */
async function getRecentFailures(userId, actionType) {
  try {
    // TODO: Query ActivityLog when created
    // For now, checking notifications
    const failures = await prisma.notification.count({
      where: {
        userId,
        type: 'error',
        metadata: {
          path: ['actionType'],
          equals: actionType,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    return failures
  } catch (error) {
    console.error('[SafetyGuard] Error getting recent failures:', error)
    return 0
  }
}

/**
 * Get recent rejections count
 */
async function getRecentRejections(userId) {
  try {
    const rejections = await prisma.notification.count({
      where: {
        userId,
        metadata: {
          path: ['rejection'],
          equals: true,
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    })

    return rejections
  } catch (error) {
    console.error('[SafetyGuard] Error getting recent rejections:', error)
    return 0
  }
}

/**
 * Get last failure time
 */
async function getLastFailureTime(userId, actionType) {
  try {
    const lastFailure = await prisma.notification.findFirst({
      where: {
        userId,
        type: 'error',
        metadata: {
          path: ['actionType'],
          equals: actionType,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return lastFailure?.createdAt || null
  } catch (error) {
    console.error('[SafetyGuard] Error getting last failure time:', error)
    return null
  }
}

/**
 * Reset safety counters (for testing or manual reset)
 * @param {string} userId - User ID
 */
export async function resetSafetyCounters(userId) {
  try {
    // TODO: Clear ActivityLog entries when created
    // For now, marking notifications as read
    await prisma.notification.updateMany({
      where: {
        userId,
        type: { in: ['error', 'info'] },
        metadata: {
          path: ['failure'],
          equals: true,
        },
      },
      data: {
        read: true,
      },
    })

    return { reset: true }
  } catch (error) {
    console.error('[SafetyGuard] Error resetting counters:', error)
    return { reset: false, error: error.message }
  }
}


