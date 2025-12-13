import { getChatCompletion } from '@/lib/openai'
import { saveMemory, getMemoryContext, searchMemory } from '@/lib/memory'
import { prisma } from '@/lib/prisma'
import { extractTasksFromEmail } from './task_extractor'
import { generateReply } from './reply_generator'
import { scheduleFollowUp } from './followup_scheduler'
import { analyzeEmailThread } from './email_thread_analyzer'
import { computePriority } from './priority_engine'

/**
 * Main agent runner - processes input and determines actions
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

