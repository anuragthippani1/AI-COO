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
        const now = new Date()
        
        // Check for daily summary time (9 AM)
        if (now.getHours() === 9 && now.getMinutes() < 5) {
          await eventSystem.emit(EVENTS.DAILY_SUMMARY_TIME, user.id, {})
        }

        // Check for weekly planning (Monday 9 AM)
        if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 5) {
          await eventSystem.emit(EVENTS.WEEKLY_PLANNING_TIME, user.id, {})
        }

        // Check for overdue tasks
        await this.checkOverdueTasks(user.id)

        // Check for tasks due soon (within 24 hours)
        await this.checkTasksDueSoon(user.id)

        // Check for due follow-ups
        await this.checkDueFollowUps(user.id)

        // Check for overdue invoices
        await this.checkOverdueInvoices(user.id)

        // Check for upcoming calendar events (within 1 hour)
        await this.checkUpcomingCalendarEvents(user.id)
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
    try {
      const { taskId } = eventData
      const task = await prisma.task.findUnique({
        where: { id: taskId },
      })

      if (!task || task.status === 'COMPLETED') return

      // Decide whether to notify user about upcoming task
      const decision = await makeDecision(
        userId,
        'notify_task_due_soon',
        {
          task,
          hoursUntilDue: task.dueDate 
            ? Math.floor((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60))
            : null,
        },
        { task, event: EVENTS.TASK_OVERDUE }
      )

      if (decision.decision === 'auto_execute' && decision.executed) {
        // Create notification
        const { createNotification } = await import('@/lib/notifications')
        await createNotification(userId, {
          type: 'info',
          title: 'Task Due Soon',
          message: `Task "${task.title}" is due ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'soon'}`,
          metadata: { taskId: task.id },
        })
        console.log(`[AgentLoop] Notified user about task due soon: ${taskId}`)
      } else if (decision.approvalRequestId) {
        console.log(`[AgentLoop] Task due soon notification pending approval: ${decision.approvalRequestId}`)
      }
    } catch (error) {
      console.error('[AgentLoop] Error handling task due soon:', error)
      await recordFailure(userId, 'notify_task_due_soon', error.message)
    }
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
    try {
      const { eventId, eventTitle, startTime, minutesUntil } = eventData

      // Decide whether to send reminder
      const decision = await makeDecision(
        userId,
        'send_calendar_reminder',
        {
          eventId,
          eventTitle,
          startTime,
          minutesUntil,
        },
        { event: EVENTS.CALENDAR_EVENT_SOON, eventData }
      )

      if (decision.decision === 'auto_execute' && decision.executed) {
        // Create notification
        const { createNotification } = await import('@/lib/notifications')
        await createNotification(userId, {
          type: 'info',
          title: 'Upcoming Event',
          message: `"${eventTitle}" starts ${minutesUntil < 60 ? `in ${minutesUntil} minutes` : `in ${Math.floor(minutesUntil / 60)} hours`}`,
          metadata: { eventId, startTime },
        })
        console.log(`[AgentLoop] Sent calendar reminder for event: ${eventId}`)
      } else if (decision.approvalRequestId) {
        console.log(`[AgentLoop] Calendar reminder pending approval: ${decision.approvalRequestId}`)
      }
    } catch (error) {
      console.error('[AgentLoop] Error handling calendar event soon:', error)
      await recordFailure(userId, 'send_calendar_reminder', error.message)
    }
  }

  /**
   * Handle invoice overdue
   */
  async handleInvoiceOverdue(userId, eventData) {
    try {
      const { invoiceId } = eventData
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      })

      if (!invoice || invoice.status === 'paid') return

      // Update invoice status to overdue
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'overdue' },
      })

      // Decide whether to send reminder email
      const decision = await makeDecision(
        userId,
        'send_invoice_reminder',
        {
          invoice,
          daysOverdue: invoice.dueDate 
            ? Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))
            : 0,
        },
        { invoice, event: EVENTS.INVOICE_OVERDUE }
      )

      if (decision.decision === 'auto_execute' && decision.executed && invoice.clientEmail) {
        // Send reminder email
        const { sendEmail } = await import('@/lib/gmail')
        const invoiceUrl = invoice.pdfUrl 
          ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${invoice.pdfUrl}`
          : null
        
        await sendEmail(
          userId,
          invoice.clientEmail,
          `Reminder: Invoice ${invoice.invoiceNumber} is Overdue`,
          `Dear ${invoice.clientName},\n\nThis is a reminder that invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} is overdue.\n\n${invoiceUrl ? `View invoice: ${invoiceUrl}\n\n` : ''}Please arrange payment at your earliest convenience.\n\nThank you!`,
          `<p>Dear ${invoice.clientName},</p><p>This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> for <strong>$${invoice.total.toFixed(2)}</strong> is overdue.</p>${invoiceUrl ? `<p><a href="${invoiceUrl}">View Invoice</a></p>` : ''}<p>Please arrange payment at your earliest convenience.</p><p>Thank you!</p>`
        )
        
        console.log(`[AgentLoop] Sent overdue invoice reminder: ${invoiceId}`)
      } else if (decision.approvalRequestId) {
        console.log(`[AgentLoop] Invoice reminder pending approval: ${decision.approvalRequestId}`)
      }

      // Always create notification for overdue invoice
      const { createNotification } = await import('@/lib/notifications')
      await createNotification(userId, {
        type: 'urgent',
        title: 'Overdue Invoice',
        message: `Invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} is overdue`,
        metadata: { invoiceId: invoice.id },
      })
    } catch (error) {
      console.error('[AgentLoop] Error handling invoice overdue:', error)
      await recordFailure(userId, 'send_invoice_reminder', error.message)
    }
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
          status: { in: ['sent', 'SENT'] },
          dueDate: {
            lt: new Date(),
          },
        },
      })

      for (const invoice of overdueInvoices) {
        // Only emit if not already processed (check metadata for last reminder)
        const lastReminder = invoice.metadata?.lastReminderAt
        const shouldRemind = !lastReminder || 
          (new Date() - new Date(lastReminder)) > 24 * 60 * 60 * 1000 // Remind once per day

        if (shouldRemind) {
          await eventSystem.emit(EVENTS.INVOICE_OVERDUE, userId, { invoiceId: invoice.id, invoice })
          
          // Mark reminder sent
          await prisma.invoice.update({
            where: { id: invoice.id },
            data: {
              metadata: {
                ...(invoice.metadata || {}),
                lastReminderAt: new Date().toISOString(),
              },
            },
          })
        }
      }
    } catch (error) {
      console.error('[AgentLoop] Error checking overdue invoices:', error)
    }
  }

  /**
   * Check for tasks due soon (within 24 hours)
   */
  async checkTasksDueSoon(userId) {
    try {
      const now = new Date()
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      const tasksDueSoon = await prisma.task.findMany({
        where: {
          userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: {
            gte: now,
            lte: in24Hours,
          },
        },
      })

      for (const task of tasksDueSoon) {
        // Check if we've already notified about this task (avoid spam)
        const lastNotified = task.metadata?.lastDueSoonNotification
        const hoursUntilDue = Math.floor((new Date(task.dueDate) - now) / (1000 * 60 * 60))
        
        // Notify if:
        // - Never notified, OR
        // - Last notified more than 6 hours ago, OR
        // - Task is due within 2 hours (urgent reminder)
        const shouldNotify = !lastNotified ||
          (now - new Date(lastNotified)) > 6 * 60 * 60 * 1000 ||
          hoursUntilDue <= 2

        if (shouldNotify) {
          await eventSystem.emit(EVENTS.TASK_DUE_SOON, userId, {
            taskId: task.id,
            task,
            hoursUntilDue,
          })

          // Mark notification sent
          await prisma.task.update({
            where: { id: task.id },
            data: {
              metadata: {
                ...(task.metadata || {}),
                lastDueSoonNotification: new Date().toISOString(),
              },
            },
          })
        }
      }
    } catch (error) {
      console.error('[AgentLoop] Error checking tasks due soon:', error)
    }
  }

  /**
   * Check for upcoming calendar events (within 1 hour)
   */
  async checkUpcomingCalendarEvents(userId) {
    try {
      const { listCalendarEvents } = await import('@/lib/calendar')
      
      const now = new Date()
      const in1Hour = new Date(now.getTime() + 60 * 60 * 1000)

      // Fetch events from Google Calendar
      const events = await listCalendarEvents(
        userId,
        now.toISOString(),
        in1Hour.toISOString()
      )

      for (const event of events) {
        if (!event.start || !event.start.dateTime) continue

        const eventStart = new Date(event.start.dateTime)
        const minutesUntil = Math.floor((eventStart - now) / (1000 * 60))

        // Only notify if event is within 60 minutes and not in the past
        if (minutesUntil >= 0 && minutesUntil <= 60) {
          // Check if we've already notified (avoid duplicate notifications)
          const lastNotified = event.extendedProperties?.private?.lastReminderAt
          const shouldNotify = !lastNotified || 
            (now - new Date(lastNotified)) > 30 * 60 * 1000 // Remind once per 30 minutes

          if (shouldNotify) {
            await eventSystem.emit(EVENTS.CALENDAR_EVENT_SOON, userId, {
              eventId: event.id,
              eventTitle: event.summary || 'Untitled Event',
              startTime: event.start.dateTime,
              minutesUntil,
              event,
            })
          }
        }
      }
    } catch (error) {
      // Silently fail if calendar is not connected - this is expected for some users
      if (error.message !== 'Google Calendar not connected') {
        console.error('[AgentLoop] Error checking upcoming calendar events:', error)
      }
    }
  }
}

// Singleton instance
export const agentLoop = new AgentLoop()

// Auto-start in production (can be controlled via env var)
if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
  agentLoop.start()
}

