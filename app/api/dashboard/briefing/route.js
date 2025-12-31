import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

/**
 * Decision-based Dashboard Briefing
 * Returns what AI COO did, what needs approval, and what's urgent
 */
export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Get recent activity (last 24 hours)
    const recentActivities = await prisma.activityLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })

    // Get pending approvals
    const pendingApprovals = await prisma.notification.findMany({
      where: {
        userId,
        type: 'approval_required',
        read: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get urgent items (high priority tasks, urgent emails)
    const urgentTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        priority: { in: ['URGENT', 'HIGH'] },
      },
      orderBy: { dueDate: 'asc' },
      take: 5,
    })

    const urgentEmails = await prisma.email.findMany({
      where: {
        userId,
        status: 'UNREAD',
        metadata: {
          path: ['classification', 'urgency'],
          equals: 'urgent',
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: 5,
    })

    // Get today's summary
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayActivities = recentActivities.filter(
      (activity) => new Date(activity.createdAt) >= today
    )

    const todayStats = {
      emailsProcessed: todayActivities.filter((a) => a.actionType === 'classify_email').length,
      tasksCreated: todayActivities.filter((a) => a.actionType === 'create_task').length,
      repliesSent: todayActivities.filter((a) => a.actionType === 'send_email').length,
      followUpsScheduled: todayActivities.filter((a) => a.actionType === 'schedule_followup').length,
    }

    // Format activities for display
    const formattedActivities = recentActivities.map((activity) => {
      let actionDescription = ''
      let icon = '🤖'

      switch (activity.actionType) {
        case 'classify_email':
          actionDescription = `Classified email as ${activity.outputData?.category || 'email'}`
          icon = '📧'
          break
        case 'create_task':
          actionDescription = `Created task: ${activity.outputData?.taskId ? 'Task created' : activity.inputData?.task?.title || 'New task'}`
          icon = '✅'
          break
        case 'send_email':
          actionDescription = `Replied to ${activity.inputData?.to || 'email'}`
          icon = '💬'
          break
        case 'schedule_followup':
          actionDescription = `Scheduled follow-up`
          icon = '📅'
          break
        case 'update_crm':
          actionDescription = `Updated CRM: ${activity.outputData?.status || 'lead detected'}`
          icon = '👥'
          break
        default:
          actionDescription = activity.actionType.replace(/_/g, ' ')
          icon = '⚙️'
      }

      return {
        id: activity.id,
        icon,
        action: actionDescription,
        status: activity.status,
        confidence: activity.confidenceScore,
        risk: activity.riskLevel,
        explanation: activity.explanation,
        timestamp: activity.createdAt,
        agent: activity.agentName,
      }
    })

    // Format pending approvals
    const formattedApprovals = pendingApprovals.map((approval) => {
      const metadata = approval.metadata || {}
      let actionDescription = ''
      let icon = '⏳'

      switch (metadata.actionType) {
        case 'create_task':
          actionDescription = `Create task: ${metadata.actionData?.task?.title || 'New task'}`
          icon = '✅'
          break
        case 'send_email':
          actionDescription = `Send reply to ${metadata.actionData?.to || 'email'}`
          icon = '💬'
          break
        case 'schedule_followup':
          actionDescription = `Schedule follow-up`
          icon = '📅'
          break
        default:
          actionDescription = metadata.actionType?.replace(/_/g, ' ') || 'Action requires approval'
      }

      return {
        id: approval.id,
        icon,
        action: actionDescription,
        confidence: metadata.confidenceScore,
        risk: metadata.riskLevel,
        explanation: metadata.explanation || approval.message,
        timestamp: approval.createdAt,
        actionData: metadata.actionData,
      }
    })

    // Format urgent items
    const urgentItems = [
      ...urgentTasks.map((task) => ({
        id: task.id,
        type: 'task',
        title: task.title,
        priority: task.priority,
        dueDate: task.dueDate,
        icon: '✅',
        url: '/tasks',
      })),
      ...urgentEmails.map((email) => ({
        id: email.id,
        type: 'email',
        title: email.subject,
        from: email.from,
        priority: 'URGENT',
        receivedAt: email.receivedAt,
        icon: '📧',
        url: '/inbox',
      })),
    ].sort((a, b) => {
      // Sort by priority and date
      const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
      const aPriority = priorityOrder[a.priority] || 3
      const bPriority = priorityOrder[b.priority] || 3
      if (aPriority !== bPriority) return aPriority - bPriority
      return new Date(b.dueDate || b.receivedAt) - new Date(a.dueDate || a.receivedAt)
    })

    return NextResponse.json({
      success: true,
      briefing: {
        today: {
          summary: `AI COO processed ${todayStats.emailsProcessed} emails, created ${todayStats.tasksCreated} tasks, sent ${todayStats.repliesSent} replies, and scheduled ${todayStats.followUpsScheduled} follow-ups today.`,
          stats: todayStats,
        },
        activities: formattedActivities,
        pendingApprovals: formattedApprovals,
        urgentItems: urgentItems.slice(0, 5),
        needsAttention: {
          approvals: formattedApprovals.length,
          urgent: urgentItems.length,
        },
      },
    })
  } catch (error) {
    console.error('Dashboard briefing error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




