import { getChatCompletion } from '@/lib/openai'
import { saveMemory, getMemoryContext, searchMemory } from '@/lib/memory'
import { prisma } from '@/lib/prisma'
import { extractTasksFromEmail } from './task_extractor'
import { generateReply } from './reply_generator'
import { scheduleFollowUp } from './followup_scheduler'
import { analyzeEmailThread } from './email_thread_analyzer'
import { computePriority } from './priority_engine'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval, createApprovalRequest } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { explainDecision } from './explainability_engine'

/**
 * Main agent runner - processes input and determines actions
 * CENTRALIZED DECISION HUB: All AI actions flow through here for confidence-based execution
 */
export async function runAgent(input) {
  try {
    // Get relevant memory context
    const memoryContext = await getMemoryContext(input.userId, input.content)

    // Build system prompt with memory context
    const systemPrompt = `You are an AI COO assistant helping manage business operations.
You have access to the user's memory and context:
${memoryContext}

Your capabilities:
1. Extract tasks from emails and messages
2. Generate email replies
3. Schedule follow-ups
4. Create workflows
5. Answer questions using memory

Be concise, actionable, and professional.`

    const userPrompt = `User request (type: ${input.type}):
${input.content}

${input.metadata ? `Metadata: ${JSON.stringify(input.metadata)}` : ''}

What should I do?`

    // Get AI decision
    const decision = await getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Save interaction to memory
    await saveMemory(input.userId, `User: ${input.content}\nAI: ${decision}`, {
      type: 'conversation',
      source: 'agent',
    })

    // Route to appropriate handler
    switch (input.type) {
      case 'email':
        return await handleEmail(input)
      case 'task':
        return await handleTask(input)
      case 'query':
        return await handleQuery(input, decision)
      case 'workflow':
        return await handleWorkflow(input)
      default:
        return {
          success: false,
          error: 'Unknown input type',
        }
    }
  } catch (error) {
    console.error('Agent error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Centralized decision maker for AI actions
 * Determines: auto-execute, request approval, or escalate
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (create_task, send_email, etc.)
 * @param {object} actionData - Data for the action
 * @param {object} context - Additional context (email, task, etc.)
 * @returns {Promise<{decision: string, executed?: boolean, approvalRequestId?: string, explanation?: string}>}
 */
export async function makeDecision(userId, actionType, actionData, context = {}) {
  try {
    // Evaluate confidence and risk
    const confidenceResult = await evaluateConfidence(context, actionData)
    const { confidenceScore, riskLevel } = confidenceResult

    // Check if approval is required
    const approvalCheck = await shouldRequireApproval(
      userId,
      actionType,
      confidenceScore,
      riskLevel
    )

    // Generate explanation for the action
    const explanation = await explainDecision(actionType, {
      ...context,
      actionData,
      confidenceScore,
      riskLevel,
    })

    // Decision logic: auto-execute if high confidence and low risk
    if (!approvalCheck.requiresApproval && confidenceScore >= 80 && riskLevel === 'low') {
      // Auto-execute
      await logActivity(userId, actionType, 'agent_manager', 'completed', {
        confidenceScore,
        riskLevel,
        inputData: context,
        outputData: actionData,
        explanation: `${explanation} (Auto-executed)`,
      })

      return {
        decision: 'auto_execute',
        executed: true,
        confidenceScore,
        riskLevel,
        explanation,
      }
    } else if (confidenceScore >= 70 && riskLevel !== 'high') {
      // Request approval but suggest auto-execution
      const approvalRequest = await createApprovalRequest(
        userId,
        actionType,
        actionData,
        { confidenceScore, riskLevel },
        explanation
      )

      await logActivity(userId, actionType, 'agent_manager', 'pending_approval', {
        confidenceScore,
        riskLevel,
        inputData: context,
        outputData: actionData,
        explanation: `${explanation} (Pending approval)`,
      })

      return {
        decision: 'request_approval',
        executed: false,
        approvalRequestId: approvalRequest.approvalRequestId,
        confidenceScore,
        riskLevel,
        explanation,
      }
    } else {
      // Low confidence or high risk - require approval
      const approvalRequest = await createApprovalRequest(
        userId,
        actionType,
        actionData,
        { confidenceScore, riskLevel },
        explanation
      )

      await logActivity(userId, actionType, 'agent_manager', 'requires_approval', {
        confidenceScore,
        riskLevel,
        inputData: context,
        outputData: actionData,
        explanation: `${explanation} (Requires approval - low confidence or high risk)`,
      })

      return {
        decision: 'require_approval',
        executed: false,
        approvalRequestId: approvalRequest.approvalRequestId,
        confidenceScore,
        riskLevel,
        explanation,
      }
    }
  } catch (error) {
    console.error('[AgentManager] Error making decision:', error)
    // On error, require approval for safety
    return {
      decision: 'require_approval',
      executed: false,
      confidenceScore: 0,
      riskLevel: 'high',
      explanation: 'Error evaluating action - approval required',
      error: error.message,
    }
  }
}

async function handleEmail(input) {
  const emailContent = input.content
  const emailMetadata = input.metadata || {}

  // Analyze email thread if threadId available
  let threadInsights = null
  if (emailMetadata.threadId) {
    try {
      const threadAnalysis = await analyzeEmailThread(input.userId, emailMetadata.threadId)
      if (threadAnalysis.success) {
        threadInsights = threadAnalysis.insights
      }
    } catch (error) {
      console.warn('Thread analysis failed:', error)
    }
  }

  // Compute priority using priority engine
  const priorityResult = await computePriority(input.userId, {
    type: 'email',
    body: emailContent,
    subject: emailMetadata.subject,
    from: emailMetadata.from,
    threadId: emailMetadata.threadId,
  })

  // Extract tasks (with priority and thread insights)
  const tasks = await extractTasksFromEmail(input.userId, emailContent, {
    ...emailMetadata,
    priority: priorityResult.priority,
    threadInsights,
  })

  // Generate reply (with thread context)
  const reply = await generateReply(input.userId, emailContent, {
    ...emailMetadata,
    threadInsights,
  })

  // Check if follow-up is needed (with priority)
  let followUpAction = null
  if (emailMetadata.needsFollowUp || threadInsights?.followUpNeeds?.length > 0) {
    followUpAction = await scheduleFollowUp(
      input.userId,
      emailMetadata.from || '',
      emailContent,
      {
        ...emailMetadata,
        priority: priorityResult.priority,
        threadInsights,
      }
    )
  }

  // TODO: Use centralized makeDecision() for each action (create_task, send_email, schedule_followup)
  // For now, returning suggestions - inbox_automation.js handles the actual execution with confidence-based logic
  // Future: Refactor inbox_automation to use agent_manager.makeDecision() for consistency

  return {
    success: true,
    data: {
      tasks,
      reply,
      followUp: followUpAction,
      priority: priorityResult.priority,
      threadInsights,
    },
    actions: [
      ...tasks.map((task) => ({
        type: 'create_task',
        payload: task,
      })),
      {
        type: 'suggest_reply',
        payload: reply,
      },
    ],
  }
}

async function handleTask(input) {
  // Parse task creation request
  const taskData = JSON.parse(input.content)
  
  const task = await prisma.task.create({
    data: {
      userId: input.userId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      source: 'ai_generated',
      metadata: taskData.metadata || {},
    },
  })

  // Save to memory
  await saveMemory(input.userId, `Task created: ${task.title}`, {
    type: 'task',
    source: 'agent',
  })

  return {
    success: true,
    data: task,
  }
}

async function handleQuery(input, aiDecision) {
  // Search memory for relevant information
  const relevantMemories = await searchMemory(input.userId, input.content, 5)

  return {
    success: true,
    data: {
      answer: aiDecision,
      relevantMemories,
    },
  }
}

async function handleWorkflow(input) {
  const workflowData = JSON.parse(input.content)

  const workflow = await prisma.workflow.create({
    data: {
      userId: input.userId,
      name: workflowData.name,
      description: workflowData.description,
      trigger: workflowData.trigger,
      actions: workflowData.actions,
      isActive: true,
      metadata: workflowData.metadata || {},
    },
  })

  return {
    success: true,
    data: workflow,
  }
}

