import { NextResponse } from 'next/server'
import { generateWeeklySchedule } from '@/ai/business_operations'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity_logger'

/**
 * Weekly Planner Automation
 * Generates weekly schedule and recommendations for users
 * Should be called by a cron job weekly (e.g., Monday mornings)
 * 
 * TODO: Set up Vercel Cron job or external scheduler to call this endpoint weekly
 * Example Vercel Cron config in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/automation/weekly-planner",
 *     "schedule": "0 9 * * 1" // 9 AM every Monday
 *   }]
 * }
 */
export async function POST(request) {
  try {
    // Verify request is from authorized source
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
        // Generate weekly schedule
        const schedule = await generateWeeklySchedule(user.id)

        if (schedule && schedule.success) {
          // Create notification for user
          await createNotification(user.id, {
            type: 'weekly_planner',
            title: 'Weekly Planner Generated',
            message: `Your weekly schedule is ready with ${schedule.recommendations?.length || 0} recommendations`,
            metadata: schedule,
          })

          // Log activity
          await logActivity(user.id, 'generate_weekly_planner', 'automation', 'completed', {
            inputData: { weekStart: new Date() },
            outputData: schedule,
            explanation: 'Weekly planner generated automatically',
          })

          results.push({ userId: user.id, success: true, schedule })
        } else {
          results.push({ userId: user.id, success: false, error: 'Failed to generate schedule' })
        }
      } catch (error) {
        console.error(`Error generating weekly planner for user ${user.id}:`, error)
        results.push({ userId: user.id, success: false, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results,
    })
  } catch (error) {
    console.error('Weekly planner automation error:', error)
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


