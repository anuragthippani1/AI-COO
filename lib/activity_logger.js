import { prisma } from './prisma'

/**
 * Activity Logger
 * Logs all AI actions for audit trail
 */

/**
 * Log an activity
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @param {string} agentName - Agent name
 * @param {string} status - Status (pending, completed, failed, rejected)
 * @param {object} data - Additional data
 * @returns {Promise<object>} Activity log entry
 */
export async function logActivity(userId, actionType, agentName, status, data = {}) {
  try {
    const activity = await prisma.activityLog.create({
      data: {
        userId,
        actionType,
        agentName,
        status,
        confidenceScore: data.confidenceScore,
        riskLevel: data.riskLevel,
        explanation: data.explanation,
        inputData: data.inputData,
        outputData: data.outputData,
        metadata: data.metadata || {},
      },
    })

    return activity
  } catch (error) {
    console.error('[ActivityLogger] Error logging activity:', error)
    // Don't throw - logging should not break the main flow
    return null
  }
}

/**
 * Update activity status
 * @param {string} activityId - Activity log ID
 * @param {string} status - New status
 * @param {object} data - Additional data to update
 */
export async function updateActivityStatus(activityId, status, data = {}) {
  try {
    await prisma.activityLog.update({
      where: { id: activityId },
      data: {
        status,
        ...data,
      },
    })
  } catch (error) {
    console.error('[ActivityLogger] Error updating activity:', error)
  }
}







