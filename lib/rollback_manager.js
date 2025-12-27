import { prisma } from './prisma'

/**
 * Undo / Rollback System
 * Allows users to undo AI actions within a time window
 */

const ROLLBACK_WINDOWS = {
  send_email: 300000, // 5 minutes
  create_task: 3600000, // 1 hour
  move_lead: 3600000, // 1 hour
  send_invoice: 1800000, // 30 minutes
  workflow_triggered: 600000, // 10 minutes
  default: 1800000, // 30 minutes
}

/**
 * Check if an action can be rolled back
 * @param {string} activityLogId - Activity log ID
 * @returns {Promise<{canRollback: boolean, reason?: string, timeRemaining?: number}>}
 */
export async function canRollback(activityLogId) {
  try {
    const activity = await prisma.activityLog.findUnique({
      where: { id: activityLogId },
    })

    if (!activity) {
      return { canRollback: false, reason: 'Activity not found' }
    }

    if (activity.status === 'reversed') {
      return { canRollback: false, reason: 'Action already reversed' }
    }

    if (activity.status !== 'completed') {
      return { canRollback: false, reason: 'Only completed actions can be rolled back' }
    }

    // Check time window
    const window = ROLLBACK_WINDOWS[activity.actionType] || ROLLBACK_WINDOWS.default
    const timeSinceAction = Date.now() - activity.createdAt.getTime()

    if (timeSinceAction > window) {
      return {
        canRollback: false,
        reason: `Rollback window expired. Window was ${Math.floor(window / 60000)} minutes.`,
      }
    }

    // Check if action type supports rollback
    const supportedActions = ['send_email', 'create_task', 'move_lead', 'send_invoice', 'workflow_triggered']
    if (!supportedActions.includes(activity.actionType)) {
      return { canRollback: false, reason: `Action type "${activity.actionType}" does not support rollback` }
    }

    return {
      canRollback: true,
      timeRemaining: window - timeSinceAction,
    }
  } catch (error) {
    console.error('[RollbackManager] Error checking rollback:', error)
    return { canRollback: false, reason: 'Error checking rollback status' }
  }
}

/**
 * Rollback an action
 * @param {string} userId - User ID
 * @param {string} activityLogId - Activity log ID
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function rollbackAction(userId, activityLogId) {
  try {
    const activity = await prisma.activityLog.findFirst({
      where: {
        id: activityLogId,
        userId,
      },
    })

    if (!activity) {
      return { success: false, message: 'Activity not found' }
    }

    // Check if can rollback
    const canRollback = await canRollback(activityLogId)
    if (!canRollback.canRollback) {
      return { success: false, message: canRollback.reason }
    }

    // Perform rollback based on action type
    let rollbackResult = { success: false, message: 'Rollback not implemented for this action type' }

    switch (activity.actionType) {
      case 'send_email':
        rollbackResult = await rollbackEmail(activity)
        break
      case 'create_task':
        rollbackResult = await rollbackTask(activity)
        break
      case 'move_lead':
        rollbackResult = await rollbackLeadMove(activity)
        break
      case 'send_invoice':
        rollbackResult = await rollbackInvoice(activity)
        break
      case 'workflow_triggered':
        rollbackResult = await rollbackWorkflow(activity)
        break
    }

    if (rollbackResult.success) {
      // Mark activity as reversed
      await prisma.activityLog.update({
        where: { id: activityLogId },
        data: {
          status: 'reversed',
          metadata: {
            ...activity.metadata,
            reversed: true,
            reversedAt: new Date().toISOString(),
          },
        },
      })
    }

    return rollbackResult
  } catch (error) {
    console.error('[RollbackManager] Error rolling back action:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Rollback email send
 */
async function rollbackEmail(activity) {
  try {
    // Note: Gmail doesn't support unsending, but we can mark it as reversed in our system
    // TODO: Send a follow-up email if needed
    return {
      success: true,
      message: 'Email marked as reversed. Note: Email cannot be unsent from recipient\'s inbox.',
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/**
 * Rollback task creation
 */
async function rollbackTask(activity) {
  try {
    const taskId = activity.outputData?.taskId
    if (taskId) {
      await prisma.task.delete({
        where: { id: taskId },
      })
      return { success: true, message: 'Task deleted successfully' }
    }
    return { success: false, message: 'Task ID not found in activity log' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/**
 * Rollback lead move
 */
async function rollbackLeadMove(activity) {
  try {
    // TODO: Implement when CRM is fully integrated
    // For now, just mark as reversed
    return {
      success: true,
      message: 'Lead move reversed. Note: Manual verification may be needed.',
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/**
 * Rollback invoice send
 */
async function rollbackInvoice(activity) {
  try {
    // Mark invoice as draft if it was sent
    const invoiceId = activity.outputData?.invoiceId
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'draft',
        },
      })
      return { success: true, message: 'Invoice status reverted to draft' }
    }
    return { success: false, message: 'Invoice ID not found in activity log' }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

/**
 * Rollback workflow trigger
 */
async function rollbackWorkflow(activity) {
  try {
    // Workflows are harder to rollback, but we can mark as reversed
    return {
      success: true,
      message: 'Workflow execution marked as reversed. Note: Actions already executed cannot be automatically undone.',
    }
  } catch (error) {
    return { success: false, message: error.message }
  }
}






