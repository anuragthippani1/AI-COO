import { prisma } from './prisma'
import { getAutonomyLevel, checkSafetyPause } from './autonomy_control'

/**
 * Human Approval Control System
 * Manages when AI actions require human approval
 */

/**
 * Check if an action requires approval
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (send_email, send_invoice, move_lead, etc.)
 * @param {number} confidenceScore - Confidence score (0-100)
 * @param {string} riskLevel - Risk level (low, medium, high)
 * @returns {Promise<{requiresApproval: boolean, reason?: string}>}
 */
export async function shouldRequireApproval(userId, actionType, confidenceScore, riskLevel) {
  try {
    // Check safety pause first
    const safetyCheck = await checkSafetyPause(userId)
    if (safetyCheck.paused) {
      return {
        requiresApproval: true,
        reason: safetyCheck.reason || 'Autonomy paused',
      }
    }

    // Get user's autonomy level
    const autonomyLevel = await getAutonomyLevel(userId)

    // Get user's approval settings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return { requiresApproval: true, reason: 'User not found' }
    }

    // Approval rules based on autonomy level
    const approvalRules = {
      full: {
        autoApprove: true,
        requireApprovalAboveRiskLevel: 'high',
        requireApprovalBelowConfidence: 60,
        requireApprovalForActions: ['send_invoice', 'create_proposal'],
      },
      moderate: {
        autoApprove: false,
        requireApprovalAboveRiskLevel: 'medium',
        requireApprovalBelowConfidence: 75,
        requireApprovalForActions: [
          'send_email',
          'send_invoice',
          'move_lead',
          'create_proposal',
          'send_whatsapp',
        ],
      },
      conservative: {
        autoApprove: false,
        requireApprovalAboveRiskLevel: 'low',
        requireApprovalBelowConfidence: 85,
        requireApprovalForActions: [
          'send_email',
          'send_invoice',
          'move_lead',
          'create_proposal',
          'send_whatsapp',
          'schedule_meeting',
          'update_crm',
          'create_task',
        ],
      },
      manual: {
        autoApprove: false,
        requireApprovalAboveRiskLevel: 'low',
        requireApprovalBelowConfidence: 100,
        requireApprovalForActions: ['*'], // All actions
      },
    }

    const rules = approvalRules[autonomyLevel] || approvalRules.moderate

    // Check if action type requires approval
    if (rules.requireApprovalForActions.includes('*') || rules.requireApprovalForActions.includes(actionType)) {
      return {
        requiresApproval: true,
        reason: `Action type "${actionType}" requires approval (${autonomyLevel} autonomy)`,
      }
    }

    // Check risk level
    const riskLevels = { low: 0, medium: 1, high: 2 }
    const requiredRiskLevel = riskLevels[rules.requireApprovalAboveRiskLevel] || 0
    if (riskLevels[riskLevel] > requiredRiskLevel) {
      return {
        requiresApproval: true,
        reason: `Risk level "${riskLevel}" requires approval`,
      }
    }

    // Check confidence score
    if (confidenceScore < rules.requireApprovalBelowConfidence) {
      return {
        requiresApproval: true,
        reason: `Confidence score ${confidenceScore}% is below threshold (${rules.requireApprovalBelowConfidence}%)`,
      }
    }

    // If auto-approve is enabled and all checks pass
    if (rules.autoApprove) {
      return { requiresApproval: false }
    }

    // Default: require approval
    return {
      requiresApproval: true,
      reason: `Default approval required (${autonomyLevel} autonomy)`,
    }
  } catch (error) {
    console.error('[ApprovalManager] Error checking approval:', error)
    // On error, require approval for safety
    return {
      requiresApproval: true,
      reason: 'Error checking approval rules',
    }
  }
}

/**
 * Create an approval request
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @param {object} actionData - Action data to be executed
 * @param {object} confidenceData - Confidence and risk data
 * @param {string} explanation - AI explanation for the action
 * @returns {Promise<object>} Approval request
 */
export async function createApprovalRequest(userId, actionType, actionData, confidenceData, explanation) {
  try {
    // Store approval request in database
    // TODO: Create ApprovalRequest model in Prisma schema
    // For now, using Notification as temporary storage
    const approvalRequest = await prisma.notification.create({
      data: {
        userId,
        type: 'approval_required',
        title: `Approval Required: ${actionType}`,
        message: explanation || `AI wants to perform: ${actionType}`,
        metadata: {
          actionType,
          actionData,
          confidenceScore: confidenceData.confidenceScore,
          riskLevel: confidenceData.riskLevel,
          explanation,
          timestamp: new Date().toISOString(),
        },
        read: false,
      },
    })

    return {
      id: approvalRequest.id,
      requiresApproval: true,
      approvalRequestId: approvalRequest.id,
    }
  } catch (error) {
    console.error('[ApprovalManager] Error creating approval request:', error)
    throw error
  }
}

/**
 * Approve an action and execute it
 * @param {string} userId - User ID
 * @param {string} approvalRequestId - Approval request ID
 * @returns {Promise<{approved: boolean, actionData?: object, result?: object}>}
 */
export async function approveAction(userId, approvalRequestId) {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: approvalRequestId,
        userId,
        type: 'approval_required',
        read: false,
      },
    })

    if (!notification) {
      return { approved: false, error: 'Approval request not found' }
    }

    const metadata = notification.metadata || {}
    const actionType = metadata.actionType
    const actionData = metadata.actionData

    if (!actionType || !actionData) {
      return { approved: false, error: 'Invalid approval request: missing action data' }
    }

    // Execute the approved action through agent_manager
    const { executeAction } = await import('@/ai/agent_manager')
    const executionResult = await executeAction(userId, actionType, actionData)

    // Mark as approved
    await prisma.notification.update({
      where: { id: approvalRequestId },
      data: {
        read: true,
        readAt: new Date(),
        metadata: {
          ...metadata,
          approved: true,
          approvedAt: new Date().toISOString(),
          executionResult,
        },
      },
    })

    // Emit event for agent loop to handle post-approval actions
    const { eventSystem, EVENTS } = await import('@/lib/event_system')
    await eventSystem.emit(EVENTS.USER_APPROVAL_RECEIVED, userId, {
      approvalRequestId,
      actionType,
      actionData,
      executionResult,
    })

    return {
      approved: true,
      actionData,
      result: executionResult.result,
    }
  } catch (error) {
    console.error('[ApprovalManager] Error approving action:', error)
    return { approved: false, error: error.message }
  }
}

/**
 * Reject an action
 * @param {string} userId - User ID
 * @param {string} approvalRequestId - Approval request ID
 * @param {string} reason - Rejection reason
 * @returns {Promise<{rejected: boolean}>}
 */
export async function rejectAction(userId, approvalRequestId, reason) {
  try {
    const notification = await prisma.notification.findFirst({
      where: {
        id: approvalRequestId,
        userId,
        type: 'approval_required',
        read: false,
      },
    })

    if (!notification) {
      return { rejected: false, error: 'Approval request not found' }
    }

    const metadata = notification.metadata || {}
    const actionType = metadata.actionType

    await prisma.notification.update({
      where: { id: approvalRequestId },
      data: {
        read: true,
        readAt: new Date(),
        metadata: {
          ...metadata,
          approved: false,
          rejected: true,
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        },
      },
    })

    // Record rejection for autonomy adjustment
    if (actionType) {
      const { recordRejection } = await import('@/lib/autonomy_control')
      await recordRejection(userId, actionType)
    }

    // Emit event for agent loop
    const { eventSystem, EVENTS } = await import('@/lib/event_system')
    await eventSystem.emit(EVENTS.USER_REJECTION_RECEIVED, userId, {
      approvalRequestId,
      actionType,
      reason,
    })

    return { rejected: true }
  } catch (error) {
    console.error('[ApprovalManager] Error rejecting action:', error)
    return { rejected: false, error: error.message }
  }
}








