import { saveMemory, searchMemory, getMemoryContext } from './memory'
import { prisma } from './prisma'

/**
 * Learn and save user's writing tone
 */
export async function learnWritingTone(userId, emailText, metadata = {}) {
  try {
    await saveMemory(userId, emailText, {
      type: 'preference',
      subtype: 'writing_tone',
      source: metadata.source || 'user',
      ...metadata,
    })
  } catch (error) {
    console.error('Error learning writing tone:', error)
  }
}

/**
 * Get user's learned writing tone
 */
export async function getWritingTone(userId) {
  try {
    const memories = await searchMemory(userId, 'writing style tone email', 5, {
      type: { $eq: 'preference' },
      subtype: { $eq: 'writing_tone' },
    })

    if (memories.length === 0) {
      return null
    }

    // Combine tone examples
    return memories.map((m) => m.text).join('\n\n')
  } catch (error) {
    console.error('Error getting writing tone:', error)
    return null
  }
}

/**
 * Save business context (services, pricing, etc.)
 */
export async function saveBusinessContext(userId, contextData) {
  try {
    const contextText = JSON.stringify(contextData)
    await saveMemory(userId, contextText, {
      type: 'preference',
      subtype: 'business_context',
      ...contextData,
    })
  } catch (error) {
    console.error('Error saving business context:', error)
  }
}

/**
 * Get business context
 */
export async function getBusinessContext(userId) {
  try {
    const memories = await searchMemory(userId, 'business services pricing', 5, {
      type: { $eq: 'preference' },
      subtype: { $eq: 'business_context' },
    })

    if (memories.length === 0) {
      return null
    }

    try {
      return JSON.parse(memories[0].text)
    } catch {
      return memories[0].text
    }
  } catch (error) {
    console.error('Error getting business context:', error)
    return null
  }
}

/**
 * Save conversation context
 */
export async function saveConversationContext(userId, conversationData) {
  try {
    const { participant, messages, summary } = conversationData
    const contextText = `Conversation with ${participant}:\n${messages.map((m) => `${m.role}: ${m.content}`).join('\n')}\n\nSummary: ${summary || 'N/A'}`

    await saveMemory(userId, contextText, {
      type: 'conversation',
      participant,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error saving conversation context:', error)
  }
}

/**
 * Get conversation history for a participant
 */
export async function getConversationHistory(userId, participant) {
  try {
    const memories = await searchMemory(userId, `conversation ${participant}`, 10, {
      type: { $eq: 'conversation' },
    })

    return memories.map((m) => ({
      text: m.text,
      metadata: m.metadata,
      timestamp: m.metadata.timestamp,
    }))
  } catch (error) {
    console.error('Error getting conversation history:', error)
    return []
  }
}

/**
 * Learn recurring task patterns
 */
export async function learnTaskPattern(userId, taskData) {
  try {
    await saveMemory(userId, `Recurring task pattern: ${taskData.title} - ${taskData.description || ''}`, {
      type: 'preference',
      subtype: 'task_pattern',
      taskTitle: taskData.title,
      frequency: taskData.frequency,
      priority: taskData.priority,
    })
  } catch (error) {
    console.error('Error learning task pattern:', error)
  }
}

