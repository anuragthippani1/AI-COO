import { prisma } from '../lib/prisma.js'
import { sendWhatsAppMessage } from '../lib/whatsapp.js'
import { sendEmail } from '../lib/gmail.js'
import { generateReply } from '../ai/reply_generator.js'
import { processWorkflowTrigger } from '../lib/workflow_engine.js'
import { checkUnpaidInvoices } from '../lib/finance.js'
import { runAutonomousMode } from '../ai/autonomy_engine.js'
import { analyzeBusinessOperations } from '../ai/business_operations.js'
import { runAutonomyLoop } from '../ai/autonomy_loop.js'

/**
 * Daily cron job to:
 * 1. Send scheduled follow-ups
 * 2. Generate daily AI COO report
 */
async function checkOverdueTasks() {
  console.log('Checking for overdue tasks and triggering workflows...')

  // Find all overdue tasks
  const overdueTasks = await prisma.task.findMany({
    where: {
      status: 'PENDING',
      dueDate: {
        lt: new Date(), // Due date is in the past
      },
    },
    include: {
      user: true,
    },
  })

  // Group by user and trigger workflows
  const tasksByUser = {}
  for (const task of overdueTasks) {
    if (!tasksByUser[task.userId]) {
      tasksByUser[task.userId] = []
    }
    tasksByUser[task.userId].push(task)
  }

  // Trigger task_overdue workflows for each user
  for (const [userId, tasks] of Object.entries(tasksByUser)) {
    for (const task of tasks) {
      try {
        await processWorkflowTrigger(userId, 'task_overdue', {
          taskId: task.id,
          title: task.title,
          description: task.description,
          priority: task.priority,
          dueDate: task.dueDate,
          taskTitle: task.title,
          contactName: task.title, // Fallback if no contact name
        })
        console.log(`Triggered task_overdue workflow for task: ${task.title} (User: ${userId})`)
      } catch (error) {
        console.error(`Error triggering workflow for task ${task.id}:`, error)
      }
    }
  }

  console.log(`Checked ${overdueTasks.length} overdue tasks across ${Object.keys(tasksByUser).length} users`)
}

async function processFollowUps() {
  console.log('Processing scheduled follow-ups...')

  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

  // Get follow-ups scheduled for the next hour
  const followUps = await prisma.followUp.findMany({
    where: {
      status: 'pending',
      scheduledFor: {
        gte: now,
        lte: oneHourFromNow,
      },
    },
    include: {
      user: true,
    },
  })

  for (const followUp of followUps) {
    try {
      let message = followUp.message

      // Generate personalized message if empty
      if (!message || message.trim() === '') {
        message = await generateReply(
          followUp.userId,
          `Follow-up for ${followUp.leadName}`,
          {
            leadName: followUp.leadName,
            leadEmail: followUp.leadEmail,
          }
        )
      }

      // Send via appropriate channel
      let sent = false
      if (followUp.channel === 'whatsapp' && followUp.leadPhone) {
        sent = await sendWhatsAppMessage(followUp.leadPhone, message)
      } else if (followUp.channel === 'email' && followUp.leadEmail) {
        try {
          await sendEmail(
            followUp.userId,
            followUp.leadEmail,
            `Follow-up: ${followUp.leadName}`,
            message
          )
          sent = true
        } catch (error) {
          console.error('Error sending email follow-up:', error)
        }
      }

      if (sent) {
        await prisma.followUp.update({
          where: { id: followUp.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
            conversationHistory: [
              ...(followUp.conversationHistory || []),
              {
                role: 'assistant',
                message,
                sentAt: new Date().toISOString(),
              },
            ],
          },
        })
        console.log(`Sent follow-up to ${followUp.leadName}`)
      }
    } catch (error) {
      console.error(`Error sending follow-up ${followUp.id}:`, error)
    }
  }
}

async function generateDailyReport() {
  console.log('Generating daily AI COO report...')

  const users = await prisma.user.findMany({
    include: {
      subscription: true,
    },
  })

  for (const user of users) {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [
        todayTasks,
        pendingTasks,
        unreadEmails,
        pendingFollowUps,
        todayRevenue,
        businessInsights,
      ] = await Promise.all([
        prisma.task.count({
          where: {
            userId: user.id,
            createdAt: { gte: today },
          },
        }),
        prisma.task.count({
          where: {
            userId: user.id,
            status: 'PENDING',
          },
        }),
        prisma.email.count({
          where: {
            userId: user.id,
            status: 'UNREAD',
          },
        }),
        prisma.followUp.count({
          where: {
            userId: user.id,
            status: 'pending',
          },
        }),
        prisma.invoice.aggregate({
          where: {
            userId: user.id,
            status: 'paid',
            paidAt: { gte: today },
          },
          _sum: { total: true },
        }),
        prisma.businessInsight.count({
          where: {
            userId: user.id,
            createdAt: { gte: today },
            priority: 'high',
          },
        }),
      ])

      const report = `
📊 Daily AI COO Report - ${new Date().toLocaleDateString()}

✅ Today's Tasks Created: ${todayTasks}
📋 Pending Tasks: ${pendingTasks}
📧 Unread Emails: ${unreadEmails}
💬 Pending Follow-ups: ${pendingFollowUps}
💰 Today's Revenue: $${todayRevenue._sum.total || 0}
🔔 High-Priority Insights: ${businessInsights}

Have a productive day!
      `.trim()

      // In production, send via email or notification
      console.log(`Report for ${user.email}:\n${report}`)
    } catch (error) {
      console.error(`Error generating report for user ${user.id}:`, error)
    }
  }
}

async function runAutonomousOperations() {
  console.log('Running autonomous operations...')

  const users = await prisma.user.findMany({
    where: {
      subscription: {
        tier: 'AI_COO', // Only for AI COO tier
      },
    },
  })

  for (const user of users) {
    try {
      await runAutonomousMode(user.id, {
        inboxMaintenance: true,
        followUpCycle: true,
        proposalGeneration: true,
        dailyDecisions: true,
      })
      console.log(`Autonomous operations completed for user ${user.id}`)
    } catch (error) {
      console.error(`Error running autonomous operations for user ${user.id}:`, error)
    }
  }
}

async function checkFinancialHealth() {
  console.log('Checking financial health...')

  const users = await prisma.user.findMany()

  for (const user of users) {
    try {
      // Check unpaid invoices
      await checkUnpaidInvoices(user.id)

      // Analyze business operations
      await analyzeBusinessOperations(user.id)

      console.log(`Financial health check completed for user ${user.id}`)
    } catch (error) {
      console.error(`Error checking financial health for user ${user.id}:`, error)
    }
  }
}

async function runAutonomyLoops() {
  console.log('Running autonomy loops for all users...')

  const users = await prisma.user.findMany({
    where: {
      subscription: {
        tier: 'AI_COO', // Only for AI COO tier
      },
    },
  })

  for (const user of users) {
    try {
      await runAutonomyLoop(user.id, {
        interval: 5 * 60 * 1000, // 5 minutes
        maxActions: 10,
        enabled: true,
        continuous: false, // Run once per cron
      })
      console.log(`Autonomy loop completed for user ${user.id}`)
    } catch (error) {
      console.error(`Error running autonomy loop for user ${user.id}:`, error)
    }
  }
}

async function main() {
  console.log('Starting cron jobs...')
  
  // Check for overdue tasks first (triggers workflows)
  await checkOverdueTasks()
  
  await processFollowUps()
  await generateDailyReport()
  await runAutonomousOperations()
  await checkFinancialHealth()
  await runAutonomyLoops() // New advanced autonomy loop
  
  console.log('Cron jobs completed')
  process.exit(0)
}

main().catch((error) => {
  console.error('Cron job error:', error)
  process.exit(1)
})



