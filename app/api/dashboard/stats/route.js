import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Get stats
    const [
      totalTasks,
      pendingTasks,
      completedTasks,
      totalEmails,
      unreadEmails,
      pendingFollowUps,
      totalInvoices,
      revenue,
    ] = await Promise.all([
      prisma.task.count({ where: { userId } }),
      prisma.task.count({ where: { userId, status: 'PENDING' } }),
      prisma.task.count({ where: { userId, status: 'COMPLETED' } }),
      prisma.email.count({ where: { userId } }),
      prisma.email.count({ where: { userId, status: 'UNREAD' } }),
      prisma.followUp.count({ where: { userId, status: 'pending' } }),
      prisma.invoice.count({ where: { userId } }),
      prisma.invoice.aggregate({
        where: { userId, status: 'paid' },
        _sum: { total: true },
      }),
    ])

    // Get recent tasks
    const recentTasks = await prisma.task.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    // Get upcoming follow-ups
    const upcomingFollowUps = await prisma.followUp.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledFor: { gte: new Date() },
      },
      orderBy: { scheduledFor: 'asc' },
      take: 5,
    })

    return NextResponse.json({
      stats: {
        tasks: {
          total: totalTasks,
          pending: pendingTasks,
          completed: completedTasks,
        },
        emails: {
          total: totalEmails,
          unread: unreadEmails,
        },
        followUps: {
          pending: pendingFollowUps,
        },
        invoices: {
          total: totalInvoices,
          revenue: revenue._sum.total || 0,
        },
      },
      recentTasks,
      upcomingFollowUps,
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

