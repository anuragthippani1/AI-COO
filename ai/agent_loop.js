/**
 * Central Agent Loop
 * Continuously observes, decides, and acts on system events
 * This is the core of the agent-driven architecture
 */

import { eventSystem, EVENTS } from '@/lib/event_system'
import { makeDecision, runAgent, executeAction } from './agent_manager'
import { processInboxEmail } from './inbox_automation'
import { prisma } from '@/lib/prisma'
import { logActivity } from '@/lib/activity_logger'
import { approveAction, rejectAction } from '@/lib/approval_manager'
import { recordFailure } from '@/lib/autonomy_control'

/**
 * Main agent loop - runs continuously
 * Observes events → Decides actions → Executes or requests approval
 */
export class AgentLoop {
  constructor() {
    this.isRunning = false
    this.intervalId = null
    this.setupEventHandlers()
  }

  /**
   * Setup event handlers for all system events
   */
  setupEventHandlers() {
    // Email events
    eventSystem.on(EVENTS.NEW_EMAIL_RECEIVED, async (userId, eventData) => {
      await this.handleNewEmail(userId, eventData)
    })

    eventSystem.on(EVENTS.EMAIL_REPLY_NEEDED, async (userId, eventData) => {
      await this.handleEmailReplyNeeded(userId, eventData)
    })

    // Task events
    eventSystem.on(EVENTS.TASK_OVERDUE, async (userId, eventData) => {
      await this.handleTaskOverdue(userId, eventData)
    })

    eventSystem.on(EVENTS.TASK_DUE_SOON, async (userId, eventData) => {
      await this.handleTaskDueSoon(userId, eventData)
    })

    // Follow-up events
    eventSystem.on(EVENTS.FOLLOWUP_DUE, async (userId, eventData) => {
      await this.handleFollowUpDue(userId, eventData)
    })

    // Calendar events
    eventSystem.on(EVENTS.CALENDAR_EVENT_SOON, async (userId, eventData) => {
      await this.handleCalendarEventSoon(userId, eventData)
    })

    // Financial events
    eventSystem.on(EVENTS.INVOICE_OVERDUE, async (userId, eventData) => {
      await this.handleInvoiceOverdue(userId, eventData)
    })

    // Time-based events
    eventSystem.on(EVENTS.DAILY_SUMMARY_TIME, async (userId, eventData) => {
      await this.handleDailySummary(userId, eventData)
    })

    eventSystem.on(EVENTS.WEEKLY_PLANNING_TIME, async (userId, eventData) => {
      await this.handleWeeklyPlanning(userId, eventData)
    })

    // Approval events
    eventSystem.on(EVENTS.USER_APPROVAL_RECEIVED, async (userId, eventData) => {
      await this.handleApproval(userId, eventData)
    })

    eventSystem.on(EVENTS.USER_REJECTION_RECEIVED, async (userId, eventData) => {
      await this.handleRejection(userId, eventData)
    })
  }

  /**
   * Start the agent loop
   * Runs periodic checks for time-based events
   */
  start() {
    if (this.isRunning) {
      console.warn('[AgentLoop] Already running')
      return
    }

    this.isRunning = true
    console.log('[AgentLoop] Started')

    // Run periodic checks every 5 minutes
    this.intervalId = setInterval(() => {
      this.checkTimeBasedEvents()
    }, 5 * 60 * 1000)

    // Run initial check
    this.checkTimeBasedEvents()
  }

  /**
   * Stop the agent loop
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
    console.log('[AgentLoop] Stopped')
  }

  /**
   * Check for time-based events (cron-safe)
   */
  async checkTimeBasedEvents() {
    try {
      const users = await prisma.user.findMany({
        where: {
          // Only active users
        },
      })

      for (const user of users) {
        // Check for daily summary time (9 AM)
        const now = new Date()
        if (now.getHours() === 9 && now.getMinutes() < 5) {
          await eventSystem.emit(EVENTS.DAILY_SUMMARY_TIME, user.id, {})
        }

        // Check for weekly planning (Monday 9 AM)
        if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 5) {
          await eventSystem.emit(EVENTS.WEEKLY_PLANNING_TIME, user.id, {})
        }

        // Check for overdue tasks
        await this.checkOverdueTasks(user.id)

        // Check for due follow-ups
        await this.checkDueFollowUps(user.id)

        // Check for overdue invoices
        await this.checkOverdueInvoices(user.id)
      }
    } catch (error) {
      console.error('[AgentLoop] Error checking time-based events:', error)
    }
  }

  /**
   * Handle new email event
   */
  async handleNewEmail(userId, eventData) {
    try {
      const { emailId } = eventData
      if (!emailId) return

      const email = await prisma.email.findUnique({
        where: { id: emailId },
      })

      if (!email || email.isProcessed) return

      // Process email through inbox automation
      // This will automatically classify, extract tasks, generate replies, etc.
      await processInboxEmail(userId, email)

      await logActivity(userId, 'process_email', 'agent_loop', 'completed', {
        inputData: { emailId, event: EVENTS.NEW_EMAIL_RECEIVED },
        outputData: { processed: true },
        explanation: 'Email processed automatically by agent loop',
      })
    } catch (error) {
      console.error('[AgentLoop] Error handling new email:', error)
      await recordFailure(userId, 'process_email', error.message)
      await logActivity(userId, 'process_email', 'agent_loop', 'failed', {
        inputData: eventData,
        outputData: { error: error.message },
      })
    }
  }

  /**
   * Handle email reply needed
   * Uses centralized makeDecision() to determine if reply should be auto-sent or require approval
   */
  async handleEmailReplyNeeded(userId, eventData) {
    try {
      const { emailId, email } = eventData
      if (!email) {
        console.warn('[AgentLoop] Email reply needed but email data missing')
        return
      }

      // Use centralized decision making for email replies
      const decision = await makeDecision(
        userId,
        'send_email',
        {
          to: email.from,
          subject: `Re: ${email.subject}`,
          body: email.replyDraft || '', // Should be generated by reply_generator
        },
        { email, emailId }
      )

      if (decision.decision === 'auto_execute' && decision.executed) {
        console.log(`[AgentLoop] Auto-sent email reply for ${emailId}`)
      } else if (decision.decision === 'request_approval' || decision.decision === 'require_approval') {
        console.log(`[AgentLoop] Email reply pending approval: ${decision.approvalRequestId}`)
      }
    } catch (error) {
      console.error('[AgentLoop] Error handling email reply:', error)
      await recordFailure(userId, 'send_email', error.message)
    }
  }

  /**
   * Handle overdue task
   */
  async handleTaskOverdue(userId, eventData) {
    try {
      const { taskId } = eventData
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      })

      if (!task) return

      // Decide what to do about overdue task
      const decision = await makeDecision(
        userId,
        'notify_task_overdue',
        { task },
        { task, event: EVENTS.TASK_OVERDUE }
      )

      if (decision.decision === 'auto_execute') {
        // Create notification
        const { createNotification } = await import('@/lib/notifications')
        await createNotification(userId, {
          type: 'urgent',
          title: 'Overdue Task',
          message: `Task "${task.title}" is overdue`,
          metadata: { taskId: task.id },
        })
      }
    } catch (error) {
      console.error('[AgentLoop] Error handling overdue task:', error)
    }
  }

  /**
   * Handle task due soon
   */
  async handleTaskDueSoon(userId, eventData) {
    // TODO: Implement task due soon logic
    console.log('[AgentLoop] Task due soon:', eventData)
  }

  /**
   * Handle follow-up due
   */
  async handleFollowUpDue(userId, eventData) {
    try {
      const { followUpId } = eventData
      const followUp = await prisma.followUp.findUnique({
        where: { id: followUpId },
      })

      if (!followUp || followUp.status !== 'pending') return

      // Decide whether to send follow-up
      const decision = await makeDecision(
        userId,
        'send_followup',
        { followUp },
        { followUp, event: EVENTS.FOLLOWUP_DUE }
      )

      if (decision.decision === 'auto_execute' && decision.executed) {
        // Already executed by makeDecision
        console.log('[AgentLoop] Follow-up handled:', followUpId)
      } else if (decision.approvalRequestId) {
        // Approval requested - will be handled after user approval
        console.log('[AgentLoop] Follow-up approval requested:', followUpId)
      }
    } catch (error) {
      console.error('[AgentLoop] Error handling follow-up due:', error)
    }
  }

  /**
   * Handle calendar event soon
   */
  async handleCalendarEventSoon(userId, eventData) {
    // TODO: Implement calendar event reminder logic
    console.log('[AgentLoop] Calendar event soon:', eventData)
  }

  /**
   * Handle invoice overdue
   */
  async handleInvoiceOverdue(userId, eventData) {
    // TODO: Implement invoice overdue logic
    console.log('[AgentLoop] Invoice overdue:', eventData)
  }

  /**
   * Handle daily summary
   */
  async handleDailySummary(userId, eventData) {
    try {
      // Trigger daily summary generation
      await eventSystem.emit(EVENTS.DAILY_SUMMARY_TIME, userId, {})
    } catch (error) {
      console.error('[AgentLoop] Error handling daily summary:', error)
    }
  }

  /**
   * Handle weekly planning
   */
  async handleWeeklyPlanning(userId, eventData) {
    try {
      // Trigger weekly planner generation
      await eventSystem.emit(EVENTS.WEEKLY_PLANNING_TIME, userId, {})
    } catch (error) {
      console.error('[AgentLoop] Error handling weekly planning:', error)
    }
  }

  /**
   * Handle user approval
   */
  async handleApproval(userId, eventData) {
    try {
      const { approvalRequestId } = eventData
      const approvalResult = await approveAction(userId, approvalRequestId)

      if (approvalResult.approved && approvalResult.result) {
        // Action already executed by approveAction
        console.log('[AgentLoop] Approved action executed:', approvalResult.result)
      } else if (approvalResult.approved) {
        // Action needs to be executed
        const actionData = approvalResult.actionData
        const metadata = eventData.metadata || {}
        const executionResult = await executeAction(userId, metadata.actionType, actionData)
        
        if (!executionResult.success) {
          await recordFailure(userId, metadata.actionType, executionResult.error || 'Execution failed')
        }
      }
    } catch (error) {
      console.error('[AgentLoop] Error handling approval:', error)
    }
  }

  /**
   * Handle user rejection
   */
  async handleRejection(userId, eventData) {
    try {
      const { approvalRequestId, reason } = eventData
      await rejectAction(userId, approvalRequestId, reason)

      await logActivity(userId, 'reject_action', 'agent_loop', 'completed', {
        inputData: { approvalRequestId, reason },
        explanation: 'User rejected action',
      })
    } catch (error) {
      console.error('[AgentLoop] Error handling rejection:', error)
    }
  }

  /**
   * Check for overdue tasks
   */
  async checkOverdueTasks(userId) {
    try {
      const overdueTasks = await prisma.task.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            lt: new Date(),
          },
        },
      })

      for (const task of overdueTasks) {
        await eventSystem.emit(EVENTS.TASK_OVERDUE, userId, { taskId: task.id, task })
      }
    } catch (error) {
      console.error('[AgentLoop] Error checking overdue tasks:', error)
    }
  }

  /**
   * Check for due follow-ups
   */
  async checkDueFollowUps(userId) {
    try {
      const dueFollowUps = await prisma.followUp.findMany({
        where: {
          userId,
          status: 'pending',
          scheduledFor: {
            lte: new Date(),
          },
        },
      })

      for (const followUp of dueFollowUps) {
        await eventSystem.emit(EVENTS.FOLLOWUP_DUE, userId, { followUpId: followUp.id, followUp })
      }
    } catch (error) {
      console.error('[AgentLoop] Error checking due follow-ups:', error)
    }
  }

  /**
   * Check for overdue invoices
   */
  async checkOverdueInvoices(userId) {
    try {
      const overdueInvoices = await prisma.invoice.findMany({
        where: {
          userId,
          status: 'SENT',
          dueDate: {
            lt: new Date(),
          },
        },
      })

      for (const invoice of overdueInvoices) {
        await eventSystem.emit(EVENTS.INVOICE_OVERDUE, userId, { invoiceId: invoice.id, invoice })
      }
    } catch (error) {
      console.error('[AgentLoop] Error checking overdue invoices:', error)
    }
  }
}

// Singleton instance
export const agentLoop = new AgentLoop()

// Auto-start in production (can be controlled via env var)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  agentLoop.start()
}

