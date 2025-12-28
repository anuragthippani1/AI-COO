import { getChatCompletion } from '@/lib/openai'
import { searchDeepMemory } from '@/lib/memory_deep'

/**
 * AI Explainability Engine
 * Generates explanations for AI decisions
 */

/**
 * Explain an AI decision
 * @param {object} context - Decision context
 * @param {object} action - Action taken/planned
 * @returns {Promise<string>} Explanation text
 */
export async function explainDecision(context, action) {
  try {
    const { userId, actionType, input } = context

    // Get relevant memory context
    const memoryContext = await searchDeepMemory(
      userId,
      `${actionType} ${JSON.stringify(input).substring(0, 200)}`,
      { limit: 5 }
    )

    // Extract signals
    const signals = extractSignals(input, action)
    const pastPatterns = extractPastPatterns(memoryContext)
    const urgencyTriggers = extractUrgencyTriggers(input)

    // Generate explanation using LLM
    const explanation = await generateExplanation(
      actionType,
      input,
      action,
      signals,
      pastPatterns,
      urgencyTriggers,
      memoryContext
    )

    return explanation
  } catch (error) {
    console.error('[ExplainabilityEngine] Error generating explanation:', error)
    return `AI decided to ${context.actionType} based on the input context.`
  }
}

/**
 * Extract signals from input
 */
function extractSignals(input, action) {
  const signals = []
  const inputStr = typeof input === 'string' ? input.toLowerCase() : JSON.stringify(input).toLowerCase()

  // Check for urgency keywords
  if (inputStr.includes('urgent') || inputStr.includes('asap') || inputStr.includes('immediately')) {
    signals.push('urgency_detected')
  }

  // Check for task keywords
  if (inputStr.includes('task') || inputStr.includes('todo') || inputStr.includes('action')) {
    signals.push('task_mentioned')
  }

  // Check for follow-up keywords
  if (inputStr.includes('follow up') || inputStr.includes('remind') || inputStr.includes('check in')) {
    signals.push('followup_needed')
  }

  // Check for question marks
  if (inputStr.includes('?')) {
    signals.push('question_asked')
  }

  // Check for email context
  if (input.emailContext) {
    signals.push('email_context_available')
    if (input.emailContext.from) signals.push('sender_identified')
    if (input.emailContext.subject) signals.push('subject_available')
  }

  return signals
}

/**
 * Extract past patterns from memory
 */
function extractPastPatterns(memoryContext) {
  const patterns = []

  if (memoryContext && memoryContext.length > 0) {
    patterns.push('similar_past_actions_found')
    
    // Check for recurring patterns
    const actionTypes = memoryContext.map(m => m.metadata?.actionType).filter(Boolean)
    if (actionTypes.length > 3) {
      patterns.push('recurring_action_pattern')
    }
  }

  return patterns
}

/**
 * Extract urgency triggers
 */
function extractUrgencyTriggers(input) {
  const triggers = []
  const inputStr = typeof input === 'string' ? input.toLowerCase() : JSON.stringify(input).toLowerCase()

  const urgencyKeywords = ['urgent', 'asap', 'immediately', 'deadline', 'today', 'now', 'critical', 'emergency']
  urgencyKeywords.forEach(keyword => {
    if (inputStr.includes(keyword)) {
      triggers.push(keyword)
    }
  })

  return triggers
}

/**
 * Generate explanation using LLM
 */
async function generateExplanation(actionType, input, action, signals, pastPatterns, urgencyTriggers, memoryContext) {
  try {
    const memorySummary = memoryContext.length > 0
      ? `Found ${memoryContext.length} similar past actions in memory.`
      : 'No similar past actions found.'

    const prompt = `Explain why the AI decided to ${actionType} based on the following:

Input Context:
${typeof input === 'string' ? input.substring(0, 500) : JSON.stringify(input).substring(0, 500)}

Proposed Action:
${JSON.stringify(action).substring(0, 300)}

Signals Detected:
${signals.join(', ') || 'None'}

Past Patterns:
${pastPatterns.join(', ') || 'None'}

Urgency Triggers:
${urgencyTriggers.join(', ') || 'None'}

Memory Context:
${memorySummary}

Generate a concise explanation (2-3 sentences) explaining:
1. What signals led to this decision
2. Why this action was chosen
3. Any relevant past patterns or context

Be clear and specific.`

    const explanation = await getChatCompletion([
      {
        role: 'system',
        content: 'You are an AI explainability assistant. Generate clear, concise explanations for AI decisions.',
      },
      { role: 'user', content: prompt },
    ], 0.5)

    return explanation.trim()
  } catch (error) {
    console.error('[ExplainabilityEngine] Error generating LLM explanation:', error)
    // Fallback explanation
    return `AI decided to ${actionType} based on ${signals.length} detected signals${urgencyTriggers.length > 0 ? ` and urgency indicators (${urgencyTriggers.join(', ')})` : ''}. ${memorySummary}`
  }
}

/**
 * Store explanation in database
 * @param {string} userId - User ID
 * @param {string} actionType - Action type
 * @param {string} explanation - Explanation text
 * @param {object} metadata - Additional metadata
 */
export async function storeExplanation(userId, actionType, explanation, metadata = {}) {
  try {
    // TODO: Create Explanation model in Prisma schema
    // For now, storing in ActivityLog (will be created)
    // This will be integrated when ActivityLog is created
    return { stored: true }
  } catch (error) {
    console.error('[ExplainabilityEngine] Error storing explanation:', error)
    return { stored: false, error: error.message }
  }
}








