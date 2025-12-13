import { getChatCompletion } from '@/lib/openai'
import { runPipeline } from './agent_orchestrator'
import { prisma } from '@/lib/prisma'
import { searchDeepMemory } from '@/lib/memory_deep'

/**
 * Natural Language Command Center
 * Parses user commands and routes to appropriate agents
 */

/**
 * Process natural language command
 */
export async function processCommand(userId, command) {
  try {
    // Parse intent
    const intent = await parseIntent(userId, command)

    // Generate execution plan
    const plan = await generatePlan(userId, intent, command)

    // Execute plan
    const result = await executePlan(userId, plan)

    return {
      success: true,
      intent,
      plan,
      result,
    }
  } catch (error) {
    console.error('Error processing command:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Parse user intent from command
 */
async function parseIntent(userId, command) {
  // Get user context from memory
  const context = await searchDeepMemory(userId, 'user preferences commands', {
    limit: 5,
  })

  const prompt = `Parse this user command and identify the intent:

Command: "${command}"

User Context:
${context.map((c) => c.text).join('\n')}

Available Actions:
- handle_email: Process or respond to an email
- create_task: Create a new task
- create_proposal: Generate a business proposal
- follow_up: Schedule or send a follow-up
- show_tasks: Display tasks
- show_inbox: Display inbox
- plan_week: Generate weekly plan
- summarize: Summarize information
- create_invoice: Create an invoice
- update_crm: Update CRM lead

Return JSON:
{
  "intent": "action_name",
  "confidence": 0.0-1.0,
  "entities": {
    "person": "name if mentioned",
    "email": "email if mentioned",
    "subject": "subject if mentioned",
    "date": "date if mentioned",
    "amount": "amount if mentioned"
  },
  "parameters": {
    "additional info extracted"
  }
}`

  try {
    const response = await getChatCompletion([
      {
        role: 'system',
        content:
          'You are a natural language command parser. Parse user commands and extract intent and entities.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return getDefaultIntent(command)
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error parsing intent:', error)
    return getDefaultIntent(command)
  }
}

/**
 * Generate execution plan
 */
async function generatePlan(userId, intent, originalCommand) {
  const plan = {
    steps: [],
    estimatedTime: 0,
    requiresConfirmation: false,
  }

  switch (intent.intent) {
    case 'handle_email':
      plan.steps = [
        {
          action: 'find_email',
          description: `Find email${intent.entities.subject ? ` about "${intent.entities.subject}"` : ''}`,
        },
        {
          action: 'process_email',
          description: 'Process email through AI agents',
        },
        {
          action: 'generate_reply',
          description: 'Generate reply if needed',
        },
      ]
      plan.estimatedTime = 5
      break

    case 'create_task':
      plan.steps = [
        {
          action: 'extract_task_details',
          description: 'Extract task title and details from command',
        },
        {
          action: 'create_task',
          description: 'Create task in database',
        },
      ]
      plan.estimatedTime = 2
      break

    case 'create_proposal':
      plan.steps = [
        {
          action: 'find_client',
          description: `Find client information${intent.entities.person ? ` for ${intent.entities.person}` : ''}`,
        },
        {
          action: 'generate_proposal',
          description: 'Generate proposal using AI',
        },
        {
          action: 'create_pdf',
          description: 'Create PDF document',
        },
      ]
      plan.estimatedTime = 10
      plan.requiresConfirmation = true
      break

    case 'follow_up':
      plan.steps = [
        {
          action: 'find_contact',
          description: `Find contact${intent.entities.person ? ` ${intent.entities.person}` : ''}`,
        },
        {
          action: 'generate_message',
          description: 'Generate follow-up message',
        },
        {
          action: 'schedule_send',
          description: 'Schedule follow-up',
        },
      ]
      plan.estimatedTime = 3
      break

    case 'show_tasks':
      plan.steps = [
        {
          action: 'fetch_tasks',
          description: 'Fetch user tasks',
        },
        {
          action: 'format_response',
          description: 'Format tasks for display',
        },
      ]
      plan.estimatedTime = 1
      break

    case 'show_inbox':
      plan.steps = [
        {
          action: 'fetch_emails',
          description: 'Fetch unread emails',
        },
        {
          action: 'format_response',
          description: 'Format emails for display',
        },
      ]
      plan.estimatedTime = 2
      break

    case 'plan_week':
      plan.steps = [
        {
          action: 'fetch_tasks',
          description: 'Fetch all tasks',
        },
        {
          action: 'fetch_calendar',
          description: 'Fetch calendar events',
        },
        {
          action: 'generate_plan',
          description: 'Generate weekly plan using AI',
        },
      ]
      plan.estimatedTime = 5
      break

    case 'summarize':
      plan.steps = [
        {
          action: 'fetch_data',
          description: 'Fetch data to summarize',
        },
        {
          action: 'generate_summary',
          description: 'Generate summary using AI',
        },
      ]
      plan.estimatedTime = 3
      break

    default:
      plan.steps = [
        {
          action: 'unknown',
          description: 'Unknown command',
        },
      ]
  }

  return plan
}

/**
 * Execute plan
 */
async function executePlan(userId, plan) {
  const results = []

  for (const step of plan.steps) {
    try {
      let stepResult

      switch (step.action) {
        case 'process_email':
          stepResult = await runPipeline(userId, {
            type: 'email',
            content: step.metadata?.emailId,
            metadata: step.metadata,
          })
          break

        case 'create_task':
          stepResult = await createTaskFromCommand(userId, step.metadata)
          break

        case 'generate_proposal':
          stepResult = await generateProposalFromCommand(userId, step.metadata)
          break

        case 'fetch_tasks':
          stepResult = await fetchTasks(userId)
          break

        case 'fetch_emails':
          stepResult = await fetchEmails(userId)
          break

        case 'generate_plan':
          stepResult = await generateWeeklyPlan(userId)
          break

        default:
          stepResult = { success: false, message: `Unknown action: ${step.action}` }
      }

      results.push({
        step: step.action,
        success: stepResult.success !== false,
        result: stepResult,
      })
    } catch (error) {
      results.push({
        step: step.action,
        success: false,
        error: error.message,
      })
    }
  }

  return {
    steps: results,
    overallSuccess: results.every((r) => r.success),
  }
}

/**
 * Helper: Create task from command
 */
async function createTaskFromCommand(userId, metadata) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: metadata.title || 'Task from command',
      description: metadata.description,
      priority: metadata.priority || 'MEDIUM',
      source: 'nlp_command',
    },
  })

  return { success: true, task }
}

/**
 * Helper: Generate proposal from command
 */
async function generateProposalFromCommand(userId, metadata) {
  const { generateProposal } = await import('./proposal_generator')
  const proposal = await generateProposal(
    userId,
    { name: metadata.clientName, email: metadata.clientEmail },
    metadata.services || [],
    metadata.pricing || []
  )

  return { success: true, proposal }
}

/**
 * Helper: Fetch tasks
 */
async function fetchTasks(userId) {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return { success: true, tasks, count: tasks.length }
}

/**
 * Helper: Fetch emails
 */
async function fetchEmails(userId) {
  const emails = await prisma.email.findMany({
    where: {
      userId,
      status: 'UNREAD',
    },
    orderBy: { receivedAt: 'desc' },
    take: 20,
  })

  return { success: true, emails, count: emails.length }
}

/**
 * Helper: Generate weekly plan
 */
async function generateWeeklyPlan(userId) {
  const { generateWeeklySchedule } = await import('./business_operations')
  const schedule = await generateWeeklySchedule(userId)

  return { success: true, schedule }
}

/**
 * Default intent if parsing fails
 */
function getDefaultIntent(command) {
  const commandLower = command.toLowerCase()

  if (commandLower.includes('email') || commandLower.includes('inbox')) {
    return { intent: 'show_inbox', confidence: 0.6, entities: {}, parameters: {} }
  }
  if (commandLower.includes('task')) {
    return { intent: 'show_tasks', confidence: 0.6, entities: {}, parameters: {} }
  }
  if (commandLower.includes('proposal')) {
    return { intent: 'create_proposal', confidence: 0.6, entities: {}, parameters: {} }
  }

  return { intent: 'unknown', confidence: 0.3, entities: {}, parameters: {} }
}

/**
 * Get command suggestions
 */
export async function getCommandSuggestions(userId) {
  return [
    'Handle this email',
    'Create a task for tomorrow',
    'Show my tasks',
    'Create a proposal for John',
    'Follow up with Raj',
    'Plan my week',
    'Summarize my inbox',
    'What do I need to do today?',
  ]
}

