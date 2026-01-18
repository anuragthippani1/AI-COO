import { getChatCompletion } from '@/lib/openai'

/**
 * Confidence & Risk Scoring System
 * Evaluates AI actions for confidence and risk levels
 */

const RISK_KEYWORDS = {
  financial: ['payment', 'invoice', 'refund', 'charge', 'cost', 'price', 'budget', 'money', 'dollar', 'revenue'],
  legal: ['contract', 'agreement', 'terms', 'legal', 'lawsuit', 'liability', 'compliance', 'nda', 'warranty'],
  sensitive: ['confidential', 'private', 'secret', 'proprietary', 'personal information', 'pii'],
  urgent: ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'deadline', 'today'],
}

/**
 * Evaluate confidence and risk for an AI action
 * @param {object} input - The input context (email, task, etc.)
 * @param {object} aiOutput - The AI-generated output
 * @returns {Promise<{confidenceScore: number, riskLevel: string, factors: object}>}
 */
export async function evaluateConfidence(input, aiOutput) {
  try {
    const factors = {
      ambiguity: 0,
      missingInfo: 0,
      threadLength: 0,
      keywordRisk: 0,
      contextQuality: 0,
    }

    // 1. Check for ambiguity
    const ambiguityScore = await checkAmbiguity(input, aiOutput)
    factors.ambiguity = ambiguityScore

    // 2. Check for missing information
    const missingInfoScore = checkMissingInfo(input, aiOutput)
    factors.missingInfo = missingInfoScore

    // 3. Check thread length (longer threads = more context but also more complexity)
    const threadLength = input.threadLength || 0
    factors.threadLength = threadLength > 10 ? 20 : threadLength > 5 ? 10 : 0

    // 4. Check for risk keywords
    const keywordRisk = checkKeywordRisk(input)
    factors.keywordRisk = keywordRisk

    // 5. Check context quality
    const contextQuality = input.contextQuality || 50
    factors.contextQuality = 100 - contextQuality

    // Calculate confidence score (0-100)
    const confidenceScore = Math.max(0, Math.min(100, 
      100 - factors.ambiguity - factors.missingInfo - (factors.threadLength / 2) - factors.keywordRisk - (factors.contextQuality / 2)
    ))

    // Determine risk level
    let riskLevel = 'low'
    if (keywordRisk > 30 || factors.ambiguity > 40 || confidenceScore < 50) {
      riskLevel = 'high'
    } else if (keywordRisk > 15 || factors.ambiguity > 25 || confidenceScore < 70) {
      riskLevel = 'medium'
    }

    return {
      confidenceScore: Math.round(confidenceScore),
      riskLevel,
      factors,
    }
  } catch (error) {
    console.error('[ConfidenceEngine] Error evaluating confidence:', error)
    // Default to low confidence on error
    return {
      confidenceScore: 30,
      riskLevel: 'high',
      factors: { error: error.message },
    }
  }
}

/**
 * Check for ambiguity in input/output using LLM
 */
async function checkAmbiguity(input, aiOutput) {
  try {
    const text = typeof input === 'string' ? input : JSON.stringify(input)
    const output = typeof aiOutput === 'string' ? aiOutput : JSON.stringify(aiOutput)

    const prompt = `Analyze the following input and AI output for ambiguity and uncertainty.

Input:
${text.substring(0, 1000)}

AI Output:
${output.substring(0, 500)}

Rate the ambiguity level from 0-100 where:
- 0-20: Very clear, no ambiguity
- 21-40: Mostly clear, minor ambiguities
- 41-60: Some ambiguity, needs clarification
- 61-80: High ambiguity, risky
- 81-100: Very ambiguous, should not proceed

Return only a number between 0-100.`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are an ambiguity analyzer. Return only a number between 0-100.',
      },
      { role: 'user', content: prompt },
    ], 0.3)

    const score = parseInt(response.trim()) || 50
    return Math.max(0, Math.min(100, score))
  } catch (error) {
    console.error('[ConfidenceEngine] Error checking ambiguity:', error)
    return 50 // Default to medium ambiguity on error
  }
}

/**
 * Check for missing information
 */
function checkMissingInfo(input, aiOutput) {
  let score = 0
  const inputStr = typeof input === 'string' ? input.toLowerCase() : JSON.stringify(input).toLowerCase()
  const outputStr = typeof aiOutput === 'string' ? aiOutput.toLowerCase() : JSON.stringify(aiOutput).toLowerCase()

  // Check for placeholder text
  if (outputStr.includes('[placeholder]') || outputStr.includes('{{') || outputStr.includes('tbd')) {
    score += 30
  }

  // Check for vague responses
  if (outputStr.includes('i\'m not sure') || outputStr.includes('unclear') || outputStr.includes('unknown')) {
    score += 20
  }

  // Check if input is very short
  if (inputStr.length < 50) {
    score += 15
  }

  // Check for missing critical info in email context
  if (input.emailContext) {
    if (!input.emailContext.from) score += 10
    if (!input.emailContext.subject) score += 10
    if (!input.emailContext.body || input.emailContext.body.length < 20) score += 15
  }

  return Math.min(100, score)
}

/**
 * Check for risk keywords
 */
function checkKeywordRisk(input) {
  let riskScore = 0
  const text = typeof input === 'string' ? input.toLowerCase() : JSON.stringify(input).toLowerCase()

  // Check each category
  for (const [category, keywords] of Object.entries(RISK_KEYWORDS)) {
    const matches = keywords.filter(keyword => text.includes(keyword.toLowerCase()))
    if (matches.length > 0) {
      if (category === 'financial' || category === 'legal') {
        riskScore += matches.length * 15
      } else if (category === 'sensitive') {
        riskScore += matches.length * 10
      } else if (category === 'urgent') {
        riskScore += matches.length * 5
      }
    }
  }

  return Math.min(100, riskScore)
}











