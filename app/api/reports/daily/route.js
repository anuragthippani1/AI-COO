import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [
      todayTasks,
      pendingTasks,
      completedTasks,
      unreadEmails,
      pendingFollowUps,
      todayRevenue,
      totalRevenue,
      recentTasks,
      upcomingFollowUps,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          userId,
          createdAt: { gte: today },
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: 'PENDING',
        },
      }),
      prisma.task.count({
        where: {
          userId,
          status: 'COMPLETED',
        },
      }),
      prisma.email.count({
        where: {
          userId,
          status: 'UNREAD',
        },
      }),
      prisma.followUp.count({
        where: {
          userId,
          status: 'pending',
        },
      }),
      prisma.invoice.aggregate({
        where: {
          userId,
          status: 'paid',
          paidAt: { gte: today },
        },
        _sum: { total: true },
      }),
      prisma.invoice.aggregate({
        where: {
          userId,
          status: 'paid',
        },
        _sum: { total: true },
      }),
      prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.followUp.findMany({
        where: {
          userId,
          status: 'pending',
          scheduledFor: { gte: new Date() },
        },
        orderBy: { scheduledFor: 'asc' },
        take: 5,
      }),
    ])

    // Generate AI insights
    const insights = []
    if (pendingTasks > 10) {
      insights.push('You have many pending tasks. Consider prioritizing or delegating.')
    }
    if (unreadEmails > 20) {
      insights.push('Your inbox has many unread emails. Consider setting up auto-replies.')
    }
    if (pendingFollowUps > 5) {
      insights.push('You have several pending follow-ups. Schedule time to reach out.')
    }

    const report = {
      date: today.toISOString(),
      summary: {
        tasks: {
          today: todayTasks,
          pending: pendingTasks,
          completed: completedTasks,
          completionRate: pendingTasks + completedTasks > 0 
            ? ((completedTasks / (pendingTasks + completedTasks)) * 100).toFixed(1)
            : 0,
        },
        emails: {
          unread: unreadEmails,
        },
        followUps: {
          pending: pendingFollowUps,
        },
        revenue: {
          today: todayRevenue._sum.total || 0,
          total: totalRevenue._sum.total || 0,
        },
      },
      recentTasks,
      upcomingFollowUps,
      insights,
    }

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Daily report error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

