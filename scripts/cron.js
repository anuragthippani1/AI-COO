import { prisma } from '../lib/prisma.js'
import { sendWhatsAppMessage } from '../lib/whatsapp.js'
import { sendEmail } from '../lib/gmail.js'
import { generateReply } from '../ai/reply_generator.js'
import { processWorkflowTrigger } from '../lib/workflow_engine.js'

/**
 * Daily cron job to:
 * 1. Send scheduled follow-ups
 * 2. Generate daily AI COO report
 */
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
      ])

      const report = `
📊 Daily AI COO Report - ${new Date().toLocaleDateString()}

✅ Today's Tasks Created: ${todayTasks}
📋 Pending Tasks: ${pendingTasks}
📧 Unread Emails: ${unreadEmails}
💬 Pending Follow-ups: ${pendingFollowUps}
💰 Today's Revenue: $${todayRevenue._sum.total || 0}

Have a productive day!
      `.trim()

      // In production, send via email or notification
      console.log(`Report for ${user.email}:\n${report}`)
    } catch (error) {
      console.error(`Error generating report for user ${user.id}:`, error)
    }
  }
}

async function main() {
  console.log('Starting cron jobs...')
  
  await processFollowUps()
  await generateDailyReport()
  
  console.log('Cron jobs completed')
  process.exit(0)
}

main().catch((error) => {
  console.error('Cron job error:', error)
  process.exit(1)
})



