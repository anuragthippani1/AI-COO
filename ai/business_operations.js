import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'
import { getMemoryContext } from '@/lib/memory'

export async function analyzeBusinessOperations(userId) {
  try {
    // Get business data
    const [
      tasks,
      emails,
      invoices,
      followUps,
      expenses,
    ] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        take: 100,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.email.findMany({
        where: { userId },
        take: 50,
        orderBy: { receivedAt: 'desc' },
      }),
      prisma.invoice.findMany({
        where: { userId },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.followUp.findMany({
        where: { userId },
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.expense.findMany({
        where: { userId },
        take: 50,
        orderBy: { date: 'desc' },
      }),
    ])

    // Get business context
    const businessContext = await getMemoryContext(userId, 'business operations preferences', 1000)

    // Analyze with AI
    const analysis = await analyzeWithAI(userId, {
      tasks,
      emails,
      invoices,
      followUps,
      expenses,
      businessContext,
    })

    // Save insights
    for (const insight of analysis.insights) {
      await prisma.businessInsight.create({
        data: {
          userId,
          type: insight.type,
          title: insight.title,
          description: insight.description,
          priority: insight.priority || 'medium',
          actionItems: insight.actionItems || [],
        },
      })

      // Create notification for high-priority insights
      if (insight.priority === 'high') {
        await createNotification(userId, {
          type: 'warning',
          title: insight.title,
          message: insight.description,
          link: '/reports',
          metadata: { type: 'business_insight', insightId: insight.id },
        })
      }
    }

    return analysis
  } catch (error) {
    console.error('Error analyzing business operations:', error)
    throw error
  }
}

async function analyzeWithAI(userId, data) {
  const prompt = `Analyze this business data and provide insights, suggestions, and risk predictions.

Tasks: ${data.tasks.length} total
- Pending: ${data.tasks.filter((t) => t.status === 'PENDING').length}
- Completed: ${data.tasks.filter((t) => t.status === 'COMPLETED').length}
- Overdue: ${data.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length}

Emails: ${data.emails.length} recent
- Unread: ${data.emails.filter((e) => e.status === 'UNREAD').length}

Invoices: ${data.invoices.length} recent
- Paid: ${data.invoices.filter((i) => i.status === 'paid').length}
- Unpaid: ${data.invoices.filter((i) => i.status !== 'paid').length}
- Total Revenue: $${data.invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0)}

Follow-ups: ${data.followUps.length} recent
- Pending: ${data.followUps.filter((f) => f.status === 'pending').length}

Expenses: ${data.expenses.length} recent
- Total: $${data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)}

${data.businessContext ? `Business Context:\n${data.businessContext}` : ''}

Provide analysis with:
1. Operational suggestions (improve efficiency, reduce bottlenecks)
2. Risk predictions (overdue tasks, unpaid invoices, missed follow-ups)
3. Opportunities (potential leads, revenue growth)
4. Trends (task completion rate, response time, revenue patterns)

Return JSON:
{
  "insights": [
    {
      "type": "suggestion|risk|opportunity|trend",
      "title": "Insight title",
      "description": "Detailed description",
      "priority": "low|medium|high",
      "actionItems": ["Action 1", "Action 2"]
    }
  ],
  "summary": "Overall business health summary",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`

  const response = await getChatCompletion([
    {
      role: 'system',
      content: 'You are a business operations analyst. Analyze business data and provide actionable insights.',
    },
    { role: 'user', content: prompt },
  ])

  const jsonMatch = response?.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      insights: [],
      summary: 'Unable to analyze business operations',
      recommendations: [],
    }
  }

  return JSON.parse(jsonMatch[0])
}

export async function generateWeeklySchedule(userId) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    const followUps = await prisma.followUp.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledFor: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { scheduledFor: 'asc' },
    })

    const schedule = {
      week: new Date().toISOString(),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueDate: t.dueDate,
        priority: t.priority,
      })),
      followUps: followUps.map((f) => ({
        id: f.id,
        leadName: f.leadName,
        scheduledFor: f.scheduledFor,
      })),
      recommendations: generateScheduleRecommendations(tasks, followUps),
    }

    return schedule
  } catch (error) {
    console.error('Error generating weekly schedule:', error)
    throw error
  }
}

function generateScheduleRecommendations(tasks, followUps) {
  const recommendations = []

  // Check for overloaded days
  const tasksByDay = {}
  tasks.forEach((task) => {
    if (task.dueDate) {
      const day = new Date(task.dueDate).toDateString()
      tasksByDay[day] = (tasksByDay[day] || 0) + 1
    }
  })

  Object.entries(tasksByDay).forEach(([day, count]) => {
    if (count > 5) {
      recommendations.push(`High task load on ${day}. Consider rescheduling some tasks.`)
    }
  })

  // Check for urgent tasks
  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH')
  if (urgentTasks.length > 3) {
    recommendations.push(`You have ${urgentTasks.length} urgent tasks. Prioritize these first.`)
  }

  return recommendations
}






