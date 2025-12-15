import { runAgent } from './agent_manager'
import { searchDeepMemory } from '@/lib/memory_deep'
import { computePriority } from './priority_engine'

/**
 * Multi-Agent Orchestrator
 * Coordinates multiple AI agents to work together intelligently
 */

// Agent registry
const AGENTS = {
  INBOX: 'inbox',
  TASK: 'task',
  REPLY: 'reply',
  FOLLOWUP: 'followup',
  PROPOSAL: 'proposal',
  SCHEDULING: 'scheduling',
  CRM: 'crm',
}

// Agent execution state
const agentState = new Map()

/**
 * Run a pipeline of agents for a given event
 */
export async function runPipeline(userId, event) {
  try {
    const pipelineState = {
      userId,
      event,
      history: [],
      results: {},
      conflicts: [],
      currentStep: 0,
    }

    // Decide initial agent
    const initialAgent = await decideNextAgent(pipelineState)
    pipelineState.currentAgent = initialAgent

    // Execute pipeline
    let maxSteps = 10 // Prevent infinite loops
    while (pipelineState.currentAgent && maxSteps > 0) {
      const agentResult = await executeAgent(
        pipelineState.currentAgent,
        pipelineState
      )

      pipelineState.history.push({
        agent: pipelineState.currentAgent,
        result: agentResult,
        timestamp: new Date(),
      })

      pipelineState.results[pipelineState.currentAgent] = agentResult

      // Check for conflicts
      const conflicts = detectConflicts(pipelineState)
      if (conflicts.length > 0) {
        pipelineState.conflicts.push(...conflicts)
        // Resolve conflicts
        await resolveConflicts(pipelineState, conflicts)
      }

      // Decide next agent
      const nextAgent = await decideNextAgent(pipelineState)
      if (nextAgent && nextAgent !== pipelineState.currentAgent) {
        await handoff(pipelineState.currentAgent, nextAgent, pipelineState)
        pipelineState.currentAgent = nextAgent
      } else {
        break // Pipeline complete
      }

      maxSteps--
    }

    return {
      success: true,
      pipelineState,
      finalResults: pipelineState.results,
    }
  } catch (error) {
    console.error('Error running pipeline:', error)
    throw error
  }
}

/**
 * Decide which agent should handle the next step
 */
export async function decideNextAgent(state) {
  try {
    const { event, history, results } = state

    // Get context from memory
    const memoryContext = await searchDeepMemory(state.userId, event.type, {
      limit: 5,
    })

    // Build decision prompt
    const prompt = `Based on this event and agent history, decide which agent should handle the next step.

Event: ${JSON.stringify(event, null, 2)}

Agent History:
${history.map((h) => `${h.agent}: ${JSON.stringify(h.result)}`).join('\n')}

Available Agents:
- inbox: Process emails, classify, extract tasks
- task: Create, update, prioritize tasks
- reply: Generate email replies
- followup: Schedule and send follow-ups
- proposal: Generate business proposals
- scheduling: Manage calendar and meetings
- crm: Update CRM leads and pipeline

Current Results:
${JSON.stringify(results, null, 2)}

Memory Context:
${memoryContext.map((m) => m.text).join('\n')}

Return JSON:
{
  "nextAgent": "agent_name",
  "reason": "why this agent",
  "priority": "high|medium|low",
  "shouldStop": true|false
}`

    const response = await getChatCompletion([
      {
        role: 'system',
        content:
          'You are an agent orchestrator. Decide which agent should handle the next step in a multi-agent pipeline.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const decision = JSON.parse(jsonMatch[0])
    return decision.shouldStop ? null : decision.nextAgent
  } catch (error) {
    console.error('Error deciding next agent:', error)
    // Fallback logic
    return getFallbackAgent(state.event)
  }
}

/**
 * Execute an agent
 */
async function executeAgent(agentName, state) {
  try {
    const agentInput = {
      userId: state.userId,
      type: mapAgentToType(agentName),
      content: state.event.content || state.event.data,
      metadata: {
        ...state.event.metadata,
        pipelineState: {
          history: state.history,
          results: state.results,
        },
      },
    }

    const result = await runAgent(agentInput)

    return {
      agent: agentName,
      success: true,
      data: result.data,
      confidence: result.confidence || 0.8,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error(`Error executing agent ${agentName}:`, error)
    return {
      agent: agentName,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Handoff from one agent to another
 */
export async function handoff(fromAgent, toAgent, state) {
  try {
    // Get previous agent's output
    const previousResult = state.results[fromAgent]

    // Prepare handoff context
    const handoffContext = {
      fromAgent,
      toAgent,
      previousResult,
      event: state.event,
      history: state.history,
    }

    // Store handoff in state
    state.handoffs = state.handoffs || []
    state.handoffs.push(handoffContext)

    // Log handoff
    console.log(`Handoff: ${fromAgent} → ${toAgent}`)

    return handoffContext
  } catch (error) {
    console.error('Error in agent handoff:', error)
    throw error
  }
}

/**
 * Detect conflicts between agent actions
 */
function detectConflicts(state) {
  const conflicts = []

  // Check for duplicate tasks
  const tasks = []
  state.history.forEach((h) => {
    if (h.agent === AGENTS.TASK && h.result.data?.tasks) {
      tasks.push(...h.result.data.tasks)
    }
  })

  const duplicateTasks = findDuplicates(tasks, 'title')
  if (duplicateTasks.length > 0) {
    conflicts.push({
      type: 'duplicate_tasks',
      details: duplicateTasks,
    })
  }

  // Check for conflicting priorities
  const priorities = []
  state.history.forEach((h) => {
    if (h.result.data?.priority) {
      priorities.push(h.result.data.priority)
    }
  })

  if (hasConflictingPriorities(priorities)) {
    conflicts.push({
      type: 'conflicting_priorities',
      details: priorities,
    })
  }

  return conflicts
}

/**
 * Resolve conflicts
 */
async function resolveConflicts(state, conflicts) {
  for (const conflict of conflicts) {
    if (conflict.type === 'duplicate_tasks') {
      // Merge duplicate tasks
      console.log('Resolving duplicate tasks:', conflict.details)
      // Implementation: merge or remove duplicates
    } else if (conflict.type === 'conflicting_priorities') {
      // Use highest priority
      console.log('Resolving conflicting priorities:', conflict.details)
      // Implementation: use highest priority
    }
  }
}

/**
 * Map agent name to agent type
 */
function mapAgentToType(agentName) {
  const mapping = {
    [AGENTS.INBOX]: 'email',
    [AGENTS.TASK]: 'task',
    [AGENTS.REPLY]: 'email',
    [AGENTS.FOLLOWUP]: 'followup',
    [AGENTS.PROPOSAL]: 'proposal',
    [AGENTS.SCHEDULING]: 'scheduling',
    [AGENTS.CRM]: 'crm',
  }
  return mapping[agentName] || 'general'
}

/**
 * Fallback agent selection
 */
function getFallbackAgent(event) {
  if (event.type === 'email') return AGENTS.INBOX
  if (event.type === 'task') return AGENTS.TASK
  if (event.type === 'followup') return AGENTS.FOLLOWUP
  return AGENTS.INBOX
}

/**
 * Helper: Find duplicates
 */
function findDuplicates(array, key) {
  const seen = new Map()
  const duplicates = []
  array.forEach((item) => {
    const value = item[key]
    if (seen.has(value)) {
      duplicates.push(item)
    } else {
      seen.set(value, item)
    }
  })
  return duplicates
}

/**
 * Helper: Check for conflicting priorities
 */
function hasConflictingPriorities(priorities) {
  if (priorities.length < 2) return false
  const unique = new Set(priorities)
  return unique.size > 1
}

/**
 * Get chat completion (import from openai)
 */
async function getChatCompletion(messages) {
  const { getChatCompletion } = await import('@/lib/openai')
  return getChatCompletion(messages)
}


