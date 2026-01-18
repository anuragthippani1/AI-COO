import { getChatCompletion } from '@/lib/openai'
import { searchDeepMemory } from '@/lib/memory_deep'
import { analyzeEmailThread } from './email_thread_analyzer'

/**
 * Priority Engine
 * AI-powered priority calculation using multiple factors
 */

const PRIORITY_LEVELS = {
  URGENT: 'URGENT',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
}

/**
 * Compute priority for an email or task
 */
export async function computePriority(userId, item) {
  try {
    const factors = await analyzePriorityFactors(userId, item)
    const priority = calculatePriorityFromFactors(factors)

    return {
      priority,
      factors,
      confidence: factors.confidence || 0.8,
    }
  } catch (error) {
    console.error('Error computing priority:', error)
    // Fallback to medium priority
    return {
      priority: PRIORITY_LEVELS.MEDIUM,
      factors: { error: error.message },
      confidence: 0.5,
    }
  }
}

/**
 * Analyze all priority factors
 */
async function analyzePriorityFactors(userId, item) {
  const factors = {
    deadlines: 0,
    customerTone: 0,
    sentiment: 0,
    threadStage: 0,
    historicalPatterns: 0,
    urgencyKeywords: 0,
    confidence: 0.8,
  }

  // 1. Deadline analysis
  if (item.dueDate) {
    const daysUntilDue = getDaysUntil(item.dueDate)
    if (daysUntilDue < 0) {
      factors.deadlines = 1.0 // Overdue = urgent
    } else if (daysUntilDue <= 1) {
      factors.deadlines = 0.9 // Due today/tomorrow
    } else if (daysUntilDue <= 3) {
      factors.deadlines = 0.7 // Due this week
    } else if (daysUntilDue <= 7) {
      factors.deadlines = 0.5 // Due next week
    } else {
      factors.deadlines = 0.3 // Due later
    }
  }

  // 2. Customer tone & sentiment (for emails)
  if (item.type === 'email' || item.from) {
    const toneAnalysis = await analyzeToneAndSentiment(item.body || item.content)
    factors.customerTone = toneAnalysis.toneScore
    factors.sentiment = toneAnalysis.sentimentScore
  }

  // 3. Thread stage analysis
  if (item.threadId || item.emailId) {
    try {
      const threadAnalysis = await analyzeEmailThread(userId, item.threadId || item.emailId)
      if (threadAnalysis.success) {
        const stage = threadAnalysis.insights.conversationStage
        factors.threadStage = getStagePriority(stage)
      }
    } catch (error) {
      // Thread analysis failed, continue without it
      console.warn('Thread analysis failed:', error)
    }
  }

  // 4. Historical patterns
  const historicalPattern = await analyzeHistoricalPatterns(userId, item)
  factors.historicalPatterns = historicalPattern

  // 5. Urgency keywords
  factors.urgencyKeywords = detectUrgencyKeywords(item.body || item.content || item.title)

  return factors
}

/**
 * Calculate final priority from factors
 */
function calculatePriorityFromFactors(factors) {
  // Weighted average
  const weights = {
    deadlines: 0.25,
    customerTone: 0.15,
    sentiment: 0.15,
    threadStage: 0.15,
    historicalPatterns: 0.15,
    urgencyKeywords: 0.15,
  }

  const weightedScore =
    factors.deadlines * weights.deadlines +
    factors.customerTone * weights.customerTone +
    factors.sentiment * weights.sentiment +
    factors.threadStage * weights.threadStage +
    factors.historicalPatterns * weights.historicalPatterns +
    factors.urgencyKeywords * weights.urgencyKeywords

  // Map score to priority level
  if (weightedScore >= 0.8) {
    return PRIORITY_LEVELS.URGENT
  } else if (weightedScore >= 0.6) {
    return PRIORITY_LEVELS.HIGH
  } else if (weightedScore >= 0.4) {
    return PRIORITY_LEVELS.MEDIUM
  } else {
    return PRIORITY_LEVELS.LOW
  }
}

/**
 * Analyze tone and sentiment
 */
async function analyzeToneAndSentiment(text) {
  if (!text) {
    return { toneScore: 0.5, sentimentScore: 0.5 }
  }

  const prompt = `Analyze the tone and sentiment of this text:

${text.substring(0, 1000)}

Return JSON:
{
  "tone": "urgent|frustrated|neutral|positive|negative",
  "toneScore": 0.0-1.0,
  "sentiment": "positive|neutral|negative|urgent",
  "sentimentScore": 0.0-1.0
}`

  try {
    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are a tone and sentiment analyzer. Analyze text and return scores.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return {
        toneScore: analysis.toneScore || 0.5,
        sentimentScore: analysis.sentimentScore || 0.5,
      }
    }
  } catch (error) {
    console.error('Error analyzing tone:', error)
  }

  return { toneScore: 0.5, sentimentScore: 0.5 }
}

/**
 * Get priority score for conversation stage
 */
function getStagePriority(stage) {
  const stageScores = {
    lead: 0.6, // New leads are important
    contacted: 0.5,
    qualified: 0.7, // Qualified leads are high priority
    proposal_sent: 0.8, // Waiting for response is urgent
    negotiation: 0.9, // Active negotiation is very urgent
    post_sale: 0.4,
    support: 0.7, // Support issues can be urgent
  }
  return stageScores[stage] || 0.5
}

/**
 * Analyze historical patterns
 */
async function analyzeHistoricalPatterns(userId, item) {
  try {
    // Search memory for similar items
    const query = item.title || item.subject || item.body?.substring(0, 100) || ''
    const memories = await searchDeepMemory(userId, query, { limit: 5 })

    if (memories.length === 0) {
      return 0.5 // No historical data
    }

    // Check average priority from history
    const priorities = memories
      .map((m) => m.metadata?.priority)
      .filter((p) => p)
      .map((p) => {
        const mapping = {
          URGENT: 1.0,
          HIGH: 0.75,
          MEDIUM: 0.5,
          LOW: 0.25,
        }
        return mapping[p] || 0.5
      })

    if (priorities.length === 0) {
      return 0.5
    }

    const avgPriority = priorities.reduce((a, b) => a + b, 0) / priorities.length
    return avgPriority
  } catch (error) {
    console.error('Error analyzing historical patterns:', error)
    return 0.5
  }
}

/**
 * Detect urgency keywords
 */
function detectUrgencyKeywords(text) {
  if (!text) return 0

  const urgencyKeywords = [
    'urgent',
    'asap',
    'immediately',
    'critical',
    'emergency',
    'deadline',
    'today',
    'now',
    'important',
    'please respond',
    'need this',
    'time sensitive',
  ]

  const textLower = text.toLowerCase()
  let keywordCount = 0

  urgencyKeywords.forEach((keyword) => {
    if (textLower.includes(keyword)) {
      keywordCount++
    }
  })

  // Normalize to 0-1 scale (max 5 keywords = 1.0)
  return Math.min(1.0, keywordCount / 5)
}

/**
 * Get days until a date
 */
function getDaysUntil(date) {
  const now = new Date()
  const target = new Date(date)
  const diff = target.getTime() - now.getTime()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

/**
 * Get priority level enum
 */
export function getPriorityLevels() {
  return PRIORITY_LEVELS
}











