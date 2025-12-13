import { prisma } from '@/lib/prisma'
import { runPipeline } from './agent_orchestrator'
import { searchDeepMemory, saveDeepMemory } from '@/lib/memory_deep'
import { analyzeEmailThread } from './email_thread_analyzer'
import { computePriority } from './priority_engine'
import { shouldPauseAutonomy, recordFailure, recordRejection, requiresApprovalForConfidence } from './safety_guard'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { isFeatureEnabled } from '@/lib/feature_flags'
import { checkRateLimit } from '@/lib/cost_guard'

/**
 * Agent Autonomy Loop
 * Autonomous observation, analysis, decision, and action cycle
 */

const LOOP_INTERVAL = 5 * 60 * 1000 // 5 minutes default

/**
 * Run autonomy loop for a user
 */
export async function runAutonomyLoop(userId, config = {}) {
  try {
    const {
      interval = LOOP_INTERVAL,
      maxActions = 10,
      enabled = true,
    } = config

    if (!enabled) {
      return { success: false, reason: 'Autonomy loop disabled' }
    }

    // Check if autonomy feature is enabled
    const autonomyEnabled = await isFeatureEnabled(userId, 'autonomy_mode')
    if (!autonomyEnabled) {
      return { success: false, reason: 'Autonomy mode not enabled for this plan' }
    }

    // Check safety guard
    const safetyCheck = await shouldPauseAutonomy(userId, 'autonomy_loop')
    if (safetyCheck.shouldPause) {
      return { success: false, reason: safetyCheck.reason }
    }

    // Check rate limit
    const rateLimitCheck = await checkRateLimit(userId, 'autonomy_loop', 1000)
    if (!rateLimitCheck.allowed) {
      return { success: false, reason: rateLimitCheck.reason }
    }

    console.log(`[Autonomy Loop] Starting for user ${userId}`)

    // 1. OBSERVE
    const observations = await observe(userId)

    // 2. ANALYZE
    const analysis = await analyze(userId, observations)

    // 3. DECIDE
    const decisions = await decide(userId, analysis, maxActions)

    // 4. EXECUTE
    const results = await execute(userId, decisions)

    // 5. LEARN
    await learn(userId, observations, decisions, results)

    console.log(`[Autonomy Loop] Completed. Actions: ${results.length}`)

    return {
      success: true,
      observations,
      analysis,
      decisions,
      results,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('[Autonomy Loop] Error:', error)
    throw error
  }
}

/**
 * Step 1: Observe - Collect current state
 */
async function observe(userId) {
  const [
    unreadEmails,
    pendingTasks,
    overdueTasks,
    pendingFollowUps,
    upcomingMeetings,
    recentActivity,
  ] = await Promise.all([
    // Unread emails
    prisma.email.findMany({
      where: {
        userId,
        status: 'UNREAD',
        isProcessed: false,
      },
      take: 20,
      orderBy: { receivedAt: 'desc' },
    }),

    // Pending tasks
    prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
      },
      take: 20,
      orderBy: { dueDate: 'asc' },
    }),

    // Overdue tasks
    prisma.task.findMany({
      where: {
        userId,
        status: 'PENDING',
        dueDate: {
          lt: new Date(),
        },
      },
      take: 10,
    }),

    // Pending follow-ups
    prisma.followUp.findMany({
      where: {
        userId,
        status: 'pending',
        scheduledFor: {
          lte: new Date(Date.now() + 60 * 60 * 1000), // Next hour
        },
      },
      take: 10,
    }),

    // Upcoming meetings (would need calendar integration)
    [], // Placeholder

    // Recent activity from memory
    searchDeepMemory(userId, 'recent activity tasks emails', { limit: 10 }),
  ])

  return {
    unreadEmails: unreadEmails.length,
    unreadEmailDetails: unreadEmails,
    pendingTasks: pendingTasks.length,
    pendingTaskDetails: pendingTasks,
    overdueTasks: overdueTasks.length,
    overdueTaskDetails: overdueTasks,
    pendingFollowUps: pendingFollowUps.length,
    pendingFollowUpDetails: pendingFollowUps,
    upcomingMeetings: upcomingMeetings.length,
    recentActivity: recentActivity,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Step 2: Analyze - Understand what needs attention
 */
async function analyze(userId, observations) {
  const analysis = {
    urgentItems: [],
    recommendedActions: [],
    insights: [],
  }

  // Analyze unread emails
  for (const email of observations.unreadEmailDetails.slice(0, 5)) {
    try {
      // Get thread analysis if available
      let threadInsights = null
      if (email.threadId) {
        const threadAnalysis = await analyzeEmailThread(userId, email.threadId)
        if (threadAnalysis.success) {
          threadInsights = threadAnalysis.insights
        }
      }

      // Compute priority
      const priority = await computePriority(userId, {
        type: 'email',
        emailId: email.id,
        threadId: email.threadId,
        body: email.body,
        subject: email.subject,
        from: email.from,
      })

      if (priority.priority === 'URGENT' || priority.priority === 'HIGH') {
        analysis.urgentItems.push({
          type: 'email',
          id: email.id,
          priority: priority.priority,
          reason: 'High priority email',
          threadInsights,
        })
      }
    } catch (error) {
      console.error('Error analyzing email:', error)
    }
  }

  // Analyze overdue tasks
  for (const task of observations.overdueTaskDetails) {
    analysis.urgentItems.push({
      type: 'task',
      id: task.id,
      priority: 'URGENT',
      reason: 'Overdue task',
      task,
    })
  }

  // Analyze pending follow-ups
  for (const followUp of observations.pendingFollowUpDetails) {
    analysis.urgentItems.push({
      type: 'followup',
      id: followUp.id,
      priority: 'HIGH',
      reason: 'Scheduled follow-up due',
      followUp,
    })
  }

  // Generate insights
  if (observations.unreadEmails > 10) {
    analysis.insights.push({
      type: 'warning',
      message: `You have ${observations.unreadEmails} unread emails. Consider processing them.`,
    })
  }

  if (observations.overdueTasks > 0) {
    analysis.insights.push({
      type: 'urgent',
      message: `You have ${observations.overdueTasks} overdue tasks.`,
    })
  }

  return analysis
}

/**
 * Step 3: Decide - Determine what actions to take
 */
async function decide(userId, analysis, maxActions) {
  const decisions = []

  // Prioritize urgent items
  const sortedUrgent = analysis.urgentItems.sort((a, b) => {
    const priorityOrder = { URGENT: 3, HIGH: 2, MEDIUM: 1, LOW: 0 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })

  // Create decisions for top items
  for (const item of sortedUrgent.slice(0, maxActions)) {
    if (item.type === 'email') {
      decisions.push({
        action: 'process_email',
        target: item.id,
        priority: item.priority,
        reason: item.reason,
        metadata: item,
      })
    } else if (item.type === 'task') {
      decisions.push({
        action: 'remind_task',
        target: item.id,
        priority: item.priority,
        reason: item.reason,
        metadata: item,
      })
    } else if (item.type === 'followup') {
      decisions.push({
        action: 'send_followup',
        target: item.id,
        priority: item.priority,
        reason: item.reason,
        metadata: item,
      })
    }
  }

  return decisions
}

/**
 * Step 4: Execute - Take actions via agents
 */
async function execute(userId, decisions) {
  const results = []

  for (const decision of decisions) {
    try {
      // Evaluate confidence for this decision
      const confidence = await evaluateConfidence(
        { decision, metadata: decision.metadata },
        decision
      )

      // Check if approval required based on confidence
      if (requiresApprovalForConfidence(confidence.confidenceScore)) {
        // Skip execution, require approval
        results.push({
          decision,
          result: {
            success: false,
            requiresApproval: true,
            reason: `Low confidence (${confidence.confidenceScore}%). Approval required.`,
          },
          confidence,
          success: false,
          timestamp: new Date().toISOString(),
        })
        continue
      }

      // Check approval for specific action types
      const approvalCheck = await shouldRequireApproval(
        userId,
        decision.action,
        confidence.confidenceScore,
        confidence.riskLevel
      )

      if (approvalCheck.requiresApproval) {
        // Log as pending approval
        await logActivity(
          userId,
          decision.action,
          'autonomy_loop',
          'pending',
          {
            confidenceScore: confidence.confidenceScore,
            riskLevel: confidence.riskLevel,
            inputData: decision,
          }
        )

        results.push({
          decision,
          result: {
            success: false,
            requiresApproval: true,
            reason: approvalCheck.reason,
          },
          confidence,
          success: false,
          timestamp: new Date().toISOString(),
        })
        continue
      }

      let result

      if (decision.action === 'process_email') {
        // Process email through pipeline
        result = await runPipeline(userId, {
          type: 'email',
          content: decision.metadata.emailId,
          metadata: {
            emailId: decision.metadata.id,
            priority: decision.priority,
          },
        })
      } else if (decision.action === 'remind_task') {
        // Create notification for overdue task
        const { createNotification } = await import('@/lib/notifications')
        await createNotification(userId, {
          type: 'urgent',
          title: 'Overdue Task',
          message: `Task "${decision.metadata.task.title}" is overdue`,
          link: `/tasks?id=${decision.metadata.task.id}`,
          metadata: { taskId: decision.metadata.task.id },
        })
        result = { success: true, action: 'notification_created' }
      } else if (decision.action === 'send_followup') {
        // Send follow-up
        result = await runPipeline(userId, {
          type: 'followup',
          content: decision.metadata.followUp.id,
          metadata: {
            followUpId: decision.metadata.id,
            priority: decision.priority,
          },
        })
      }

      // Log activity
      await logActivity(
        userId,
        decision.action,
        'autonomy_loop',
        result?.success !== false ? 'completed' : 'failed',
        {
          confidenceScore: confidence.confidenceScore,
          riskLevel: confidence.riskLevel,
          inputData: decision,
          outputData: result,
        }
      )

      // Record failure if needed
      if (result?.success === false) {
        await recordFailure(userId, decision.action, result.error || 'Action failed')
      }

      results.push({
        decision,
        result,
        confidence,
        success: result?.success !== false,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Error executing decision ${decision.action}:`, error)
      
      // Record failure
      await recordFailure(userId, decision.action, error.message)
      
      // Log activity
      await logActivity(
        userId,
        decision.action,
        'autonomy_loop',
        'failed',
        {
          inputData: decision,
          outputData: { error: error.message },
        }
      )

      results.push({
        decision,
        result: { success: false, error: error.message },
        success: false,
        timestamp: new Date().toISOString(),
      })
    }
  }

  return results
}

/**
 * Step 5: Learn - Store outcomes in memory
 */
async function learn(userId, observations, decisions, results) {
  // Store successful actions
  const successfulActions = results.filter((r) => r.success)

  for (const action of successfulActions) {
    await saveDeepMemory(userId, {
      text: `Autonomous action: ${action.decision.action} on ${action.decision.target}. Result: ${JSON.stringify(action.result)}`,
      type: 'autonomy_action',
      metadata: {
        action: action.decision.action,
        target: action.decision.target,
        priority: action.decision.priority,
        result: action.result,
      },
      priority: 'medium',
    })
  }

  // Store insights
  const insights = {
    observations,
    decisionsCount: decisions.length,
    resultsCount: results.length,
    successRate: results.filter((r) => r.success).length / results.length,
  }

  await saveDeepMemory(userId, {
    text: `Autonomy loop insights: ${JSON.stringify(insights)}`,
    type: 'autonomy_insight',
    metadata: insights,
    priority: 'low',
  })
}

/**
 * Start continuous autonomy loop (for cron)
 */
export async function startAutonomyLoop(userId, config = {}) {
  const { interval = LOOP_INTERVAL } = config

  // Run immediately
  await runAutonomyLoop(userId, config)

  // Schedule next run
  if (config.continuous !== false) {
    setTimeout(() => {
      startAutonomyLoop(userId, config)
    }, interval)
  }
}

