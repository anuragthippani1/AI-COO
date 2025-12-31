import { prisma } from './prisma'

/**
 * Autonomy Control System
 * Manages user autonomy levels and safety controls
 */

const AUTONOMY_LEVELS = {
  FULL: 'full', // Auto-execute high confidence actions
  MODERATE: 'moderate', // Require approval for medium confidence
  CONSERVATIVE: 'conservative', // Require approval for most actions
  MANUAL: 'manual', // All actions require approval
}

/**
 * Get user's autonomy level
 * @param {string} userId - User ID
 * @returns {Promise<string>} Autonomy level
 */
export async function getAutonomyLevel(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    return user?.metadata?.autonomyLevel || AUTONOMY_LEVELS.MODERATE
  } catch (error) {
    console.error('[AutonomyControl] Error getting autonomy level:', error)
    return AUTONOMY_LEVELS.CONSERVATIVE // Default to conservative on error
  }
}

/**
 * Set user's autonomy level
 * @param {string} userId - User ID
 * @param {string} level - Autonomy level
 */
export async function setAutonomyLevel(userId, level) {
  try {
    if (!Object.values(AUTONOMY_LEVELS).includes(level)) {
      throw new Error(`Invalid autonomy level: ${level}`)
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          autonomyLevel: level,
        },
      },
    })
  } catch (error) {
    console.error('[AutonomyControl] Error setting autonomy level:', error)
    throw error
  }
}

/**
 * Record a failure for autonomy adjustment
 * @param {string} userId - User ID
 * @param {string} actionType - Action type that failed
 * @param {string} reason - Failure reason
 */
export async function recordFailure(userId, actionType, reason) {
  try {
    // Get current failure count
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    const metadata = user?.metadata || {}
    const failures = metadata.recentFailures || []
    
    // Add new failure
    failures.push({
      actionType,
      reason,
      timestamp: new Date().toISOString(),
    })

    // Keep only last 10 failures
    const recentFailures = failures.slice(-10)

    // If too many failures, reduce autonomy level
    const failureCount = recentFailures.length
    const currentLevel = metadata.autonomyLevel || AUTONOMY_LEVELS.MODERATE

    let newLevel = currentLevel
    if (failureCount >= 5 && currentLevel === AUTONOMY_LEVELS.FULL) {
      newLevel = AUTONOMY_LEVELS.MODERATE
    } else if (failureCount >= 3 && currentLevel === AUTONOMY_LEVELS.MODERATE) {
      newLevel = AUTONOMY_LEVELS.CONSERVATIVE
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          autonomyLevel: newLevel,
          recentFailures,
        },
      },
    })

    return { newLevel, failureCount }
  } catch (error) {
    console.error('[AutonomyControl] Error recording failure:', error)
  }
}

/**
 * Record a rejection for autonomy adjustment
 * @param {string} userId - User ID
 * @param {string} actionType - Action type that was rejected
 */
export async function recordRejection(userId, actionType) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    const metadata = user?.metadata || {}
    const rejections = metadata.recentRejections || []
    
    rejections.push({
      actionType,
      timestamp: new Date().toISOString(),
    })

    const recentRejections = rejections.slice(-10)
    const rejectionCount = recentRejections.length
    const currentLevel = metadata.autonomyLevel || AUTONOMY_LEVELS.MODERATE

    // If user rejects many actions, reduce autonomy
    let newLevel = currentLevel
    if (rejectionCount >= 5 && currentLevel === AUTONOMY_LEVELS.FULL) {
      newLevel = AUTONOMY_LEVELS.MODERATE
    } else if (rejectionCount >= 3 && currentLevel === AUTONOMY_LEVELS.MODERATE) {
      newLevel = AUTONOMY_LEVELS.CONSERVATIVE
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          ...metadata,
          autonomyLevel: newLevel,
          recentRejections,
        },
      },
    })

    return { newLevel, rejectionCount }
  } catch (error) {
    console.error('[AutonomyControl] Error recording rejection:', error)
  }
}

/**
 * Check if action should be paused due to safety
 * @param {string} userId - User ID
 * @returns {Promise<{paused: boolean, reason?: string}>}
 */
export async function checkSafetyPause(userId) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { metadata: true },
    })

    const metadata = user?.metadata || {}
    
    // Check if autonomy is paused
    if (metadata.autonomyPaused) {
      return {
        paused: true,
        reason: metadata.autonomyPauseReason || 'Autonomy paused by user',
      }
    }

    // Check failure rate
    const failures = metadata.recentFailures || []
    const recentFailures = failures.filter(
      f => new Date(f.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    )

    if (recentFailures.length >= 5) {
      return {
        paused: true,
        reason: 'Too many failures in last 24 hours',
      }
    }

    return { paused: false }
  } catch (error) {
    console.error('[AutonomyControl] Error checking safety pause:', error)
    // On error, pause for safety
    return {
      paused: true,
      reason: 'Error checking safety status',
    }
  }
}

export { AUTONOMY_LEVELS }



