import OpenAI from 'openai'

/**
 * Model Router & Fallback System
 * Routes LLM requests to appropriate models with fallback
 */

const MODEL_CONFIG = {
  default: {
    provider: 'openai',
    model: 'gpt-4o-mini', // Free/cheap model
    fallback: 'gpt-4-turbo-preview',
  },
  high_confidence: {
    provider: 'openai',
    model: 'gpt-4-turbo-preview', // Better model for important tasks
    fallback: 'gpt-4',
  },
  low_confidence: {
    provider: 'openai',
    model: 'gpt-4o-mini', // Cheaper model for low-confidence tasks
    fallback: 'gpt-3.5-turbo',
  },
}

// Initialize OpenAI client
let openai = null
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
}

/**
 * Run LLM task with automatic fallback
 * @param {string} taskType - Type of task (default, high_confidence, low_confidence)
 * @param {Array} messages - Chat messages
 * @param {object} options - Additional options
 * @returns {Promise<{content: string, model: string, attempts: number}>}
 */
export async function runLLMTask(taskType = 'default', messages, options = {}) {
  const config = MODEL_CONFIG[taskType] || MODEL_CONFIG.default
  const maxAttempts = 3
  let attempts = 0
  let lastError = null

  // Try primary model
  try {
    attempts++
    const response = await callModel(config.model, messages, options)
    return {
      content: response,
      model: config.model,
      attempts,
    }
  } catch (error) {
    console.warn(`[ModelRouter] Primary model ${config.model} failed:`, error.message)
    lastError = error

    // Try fallback model
    if (config.fallback) {
      try {
        attempts++
        const response = await callModel(config.fallback, messages, options)
        return {
          content: response,
          model: config.fallback,
          attempts,
          fallback: true,
        }
      } catch (fallbackError) {
        console.warn(`[ModelRouter] Fallback model ${config.fallback} failed:`, fallbackError.message)
        lastError = fallbackError
      }
    }
  }

  // If all models fail, throw error
  throw new Error(`All model attempts failed. Last error: ${lastError?.message || 'Unknown error'}`)
}

/**
 * Call a specific model
 */
async function callModel(model, messages, options = {}) {
  if (!openai) {
    throw new Error('OpenAI client not initialized. OPENAI_API_KEY not set.')
  }

  const response = await openai.chat.completions.create({
    model,
    messages,
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens,
  })

  return response.choices[0].message.content
}

/**
 * Route task based on confidence and importance
 * @param {number} confidenceScore - Confidence score (0-100)
 * @param {string} importance - Task importance (low, medium, high)
 * @returns {string} Task type for model routing
 */
export function routeTaskByConfidence(confidenceScore, importance = 'medium') {
  if (importance === 'high' || confidenceScore < 50) {
    return 'high_confidence' // Use better model
  } else if (confidenceScore > 80 && importance === 'low') {
    return 'low_confidence' // Use cheaper model
  }
  return 'default'
}

/**
 * Get model info
 * @param {string} taskType - Task type
 * @returns {object} Model configuration
 */
export function getModelInfo(taskType = 'default') {
  return MODEL_CONFIG[taskType] || MODEL_CONFIG.default
}









