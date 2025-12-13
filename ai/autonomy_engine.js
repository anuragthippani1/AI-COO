import { prisma } from '@/lib/prisma'
import { runAgent } from './agent_manager'
import { processWorkflowTrigger } from '@/lib/workflow_engine'
import { createNotification } from '@/lib/notifications'
import { checkUnpaidInvoices } from '@/lib/finance'
import { analyzeBusinessOperations } from './business_operations'

/**
 * Self-operating mode - AI COO makes decisions automatically
 */
export async function runAutonomousMode(userId, config = {}) {
  try {
    const results = {
      inboxMaintenance: null,
      followUpCycle: null,
      proposalGeneration: null,
      dailyDecisions: null,
    }

    // 1. Inbox Maintenance
    if (config.inboxMaintenance !== false) {
      results.inboxMaintenance = await maintainInbox(userId)
    }

    // 2. Follow-Up Cycle Management
    if (config.followUpCycle !== false) {
      results.followUpCycle = await manageFollowUpCycle(userId)
    }

    // 3. Automatic Proposal Generation
    if (config.proposalGeneration !== false) {
      results.proposalGeneration = await generateProposalsAutomatically(userId)
    }

    // 4. Daily Decision Making
    if (config.dailyDecisions !== false) {
      results.dailyDecisions = await makeDailyDecisions(userId)
    }

    return results
  } catch (error) {
    console.error('Error running autonomous mode:', error)
    throw error
  }
}

async function maintainInbox(userId) {
  try {
    // Get unread emails
    const unreadEmails = await prisma.email.findMany({
      where: {
        userId,
        status: 'UNREAD',
        isProcessed: false,
      },
      take: 20,
    })

    const processed = []
    for (const email of unreadEmails) {
      try {
        // Process with AI agent
        const agentResponse = await runAgent({
          userId,
          type: 'email',
          content: `Subject: ${email.subject}\n\n${email.body}`,
          metadata: {
            messageId: email.messageId,
            from: email.from,
            subject: email.subject,
          },
        })

        // Auto-reply if confidence is high
        if (agentResponse.data?.reply && agentResponse.confidence > 0.8) {
          // In production, you might want to send the reply
          // For now, just mark as processed
          await prisma.email.update({
            where: { id: email.id },
            data: {
              isProcessed: true,
              aiReply: agentResponse.data.reply,
              status: 'REPLIED',
            },
          })
        }

        processed.push(email.id)
      } catch (error) {
        console.error(`Error processing email ${email.id}:`, error)
      }
    }

    return {
      processed: processed.length,
      total: unreadEmails.length,
    }
  } catch (error) {
    console.error('Error maintaining inbox:', error)
    return { processed: 0, total: 0 }
  }
}

async function manageFollowUpCycle(userId) {
  try {
    // Get pending follow-ups
    const pendingFollowUps = await prisma.followUp.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledFor: {
          lte: new Date(),
        },
      },
    })

    const sent = []
    for (const followUp of pendingFollowUps) {
      try {
        // Trigger workflow for follow-up sending
        await processWorkflowTrigger(userId, 'followup_due', {
          followUpId: followUp.id,
          leadName: followUp.leadName,
          leadEmail: followUp.leadEmail,
          leadPhone: followUp.leadPhone,
        })

        sent.push(followUp.id)
      } catch (error) {
        console.error(`Error managing follow-up ${followUp.id}:`, error)
      }
    }

    return {
      sent: sent.length,
      total: pendingFollowUps.length,
    }
  } catch (error) {
    console.error('Error managing follow-up cycle:', error)
    return { sent: 0, total: 0 }
  }
}

async function generateProposalsAutomatically(userId) {
  try {
    // Find emails that look like lead inquiries
    const leadEmails = await prisma.email.findMany({
      where: {
        userId,
        status: 'UNREAD',
        metadata: {
          path: ['classification', 'category'],
          equals: 'lead',
        },
      },
      take: 5,
    })

    const generated = []
    for (const email of leadEmails) {
      try {
        // Extract service requirements from email
        const agentResponse = await runAgent({
          userId,
          type: 'email',
          content: email.body,
          metadata: {
            action: 'extract_proposal_requirements',
            from: email.from,
          },
        })

        if (agentResponse.data?.proposalRequirements) {
          // Generate proposal (would call proposal generator)
          generated.push({
            emailId: email.id,
            from: email.from,
            requirements: agentResponse.data.proposalRequirements,
          })
        }
      } catch (error) {
        console.error(`Error generating proposal for email ${email.id}:`, error)
      }
    }

    return {
      generated: generated.length,
      leads: leadEmails.length,
    }
  } catch (error) {
    console.error('Error generating proposals automatically:', error)
    return { generated: 0, leads: 0 }
  }
}

async function makeDailyDecisions(userId) {
  try {
    const decisions = []

    // 1. Check for overdue tasks
    const overdueTasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
    })

    if (overdueTasks.length > 0) {
      decisions.push({
        type: 'task_reminder',
        action: 'Send reminders for overdue tasks',
        count: overdueTasks.length,
      })

      // Create notifications
      for (const task of overdueTasks) {
        await createNotification(userId, {
          type: 'urgent',
          title: 'Overdue Task',
          message: `Task "${task.title}" is overdue`,
          link: `/tasks?id=${task.id}`,
          metadata: { taskId: task.id },
        })
      }
    }

    // 2. Check unpaid invoices
    const unpaidInvoices = await checkUnpaidInvoices(userId)
    if (unpaidInvoices.length > 0) {
      decisions.push({
        type: 'invoice_reminder',
        action: 'Send payment reminders',
        count: unpaidInvoices.length,
      })
    }

    // 3. Analyze business operations
    const analysis = await analyzeBusinessOperations(userId)
    if (analysis.insights.length > 0) {
      decisions.push({
        type: 'business_insight',
        action: 'Generated business insights',
        count: analysis.insights.length,
      })
    }

    return {
      decisions,
      summary: `Made ${decisions.length} autonomous decisions`,
    }
  } catch (error) {
    console.error('Error making daily decisions:', error)
    return { decisions: [], summary: 'Error making decisions' }
  }
}

