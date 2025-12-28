import { prisma } from './prisma'

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
    // Get user's approval settings (stored in User metadata or separate table)
    // For now, using default rules - TODO: Add user preferences table
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })

    if (!user) {
      return { requiresApproval: true, reason: 'User not found' }
    }

    // Default approval rules
    const approvalRules = {
      autoApprove: false, // Default: require approval for all actions
      requireApprovalAboveRiskLevel: 'low', // Require approval for medium+ risk
      requireApprovalForActions: [
        'send_email',
        'send_invoice',
        'move_lead',
        'create_proposal',
        'send_whatsapp',
        'schedule_meeting',
        'update_crm',
      ],
      requireApprovalBelowConfidence: 70, // Require approval if confidence < 70
    }

    // Check if action type requires approval
    if (approvalRules.requireApprovalForActions.includes(actionType)) {
      return {
        requiresApproval: true,
        reason: `Action type "${actionType}" requires approval`,
      }
    }

    // Check risk level
    const riskLevels = { low: 0, medium: 1, high: 2 }
    const requiredRiskLevel = riskLevels[approvalRules.requireApprovalAboveRiskLevel] || 0
    if (riskLevels[riskLevel] > requiredRiskLevel) {
      return {
        requiresApproval: true,
        reason: `Risk level "${riskLevel}" requires approval`,
      }
    }

    // Check confidence score
    if (confidenceScore < approvalRules.requireApprovalBelowConfidence) {
      return {
        requiresApproval: true,
        reason: `Confidence score ${confidenceScore}% is below threshold`,
      }
    }

    // If auto-approve is enabled and all checks pass
    if (approvalRules.autoApprove) {
      return { requiresApproval: false }
    }

    // Default: require approval
    return {
      requiresApproval: true,
      reason: 'Default approval required',
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
 * Approve an action
 * @param {string} userId - User ID
 * @param {string} approvalRequestId - Approval request ID
 * @returns {Promise<{approved: boolean, actionData?: object}>}
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

    // Mark as approved
    await prisma.notification.update({
      where: { id: approvalRequestId },
      data: {
        read: true,
        readAt: new Date(),
        metadata: {
          ...notification.metadata,
          approved: true,
          approvedAt: new Date().toISOString(),
        },
      },
    })

    return {
      approved: true,
      actionData: notification.metadata?.actionData,
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

    await prisma.notification.update({
      where: { id: approvalRequestId },
      data: {
        read: true,
        readAt: new Date(),
        metadata: {
          ...notification.metadata,
          approved: false,
          rejected: true,
          rejectionReason: reason,
          rejectedAt: new Date().toISOString(),
        },
      },
    })

    return { rejected: true }
  } catch (error) {
    console.error('[ApprovalManager] Error rejecting action:', error)
    return { rejected: false, error: error.message }
  }
}








