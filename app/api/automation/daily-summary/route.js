import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity_logger'

/**
 * Daily Summary Automation
 * Generates and sends daily AI COO summary to users
 * Should be called by a cron job (Vercel Cron, external scheduler, etc.)
 * 
 * TODO: Set up Vercel Cron job or external scheduler to call this endpoint daily
 * Example Vercel Cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/automation/daily-summary",
 *     "schedule": "0 9 * * *" // 9 AM daily
 *   }]
 * }
 */
export async function POST(request) {
  try {
    // Verify request is from authorized source (cron job, scheduler, etc.)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || process.env.VERCEL_CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      include: {
        subscription: true,
      },
    })

    const results = []

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
          todayActivities,
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
          prisma.activityLog.count({
            where: {
              userId: user.id,
              createdAt: { gte: today },
            },
          }),
        ])

        const summary = {
          date: new Date().toLocaleDateString(),
          tasksCreated: todayTasks,
          pendingTasks,
          unreadEmails,
          pendingFollowUps,
          todayRevenue: todayRevenue._sum.total || 0,
          aiActions: todayActivities,
        }

        // Create notification for user
        await createNotification(user.id, {
          type: 'daily_summary',
          title: `Daily AI COO Summary - ${summary.date}`,
          message: `Today: ${summary.tasksCreated} tasks created, ${summary.aiActions} AI actions, ${summary.pendingTasks} pending tasks`,
          metadata: summary,
        })

        // Log activity
        await logActivity(user.id, 'generate_daily_summary', 'automation', 'completed', {
          inputData: { date: today },
          outputData: summary,
          explanation: 'Daily summary generated automatically',
        })

        results.push({ userId: user.id, success: true, summary })
      } catch (error) {
        console.error(`Error generating daily summary for user ${user.id}:`, error)
        results.push({ userId: user.id, success: false, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Daily summary automation error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}

// Allow GET for manual testing
export async function GET(request) {
  return POST(request)
}



