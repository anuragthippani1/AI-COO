import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not set')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })

  return response.data[0].embedding
}

export async function getChatCompletion(messages, temperature = 0.7) {
  // Use model router for automatic fallback
  try {
    const { runLLMTask, routeTaskByConfidence } = await import('@/ai/model_router')
    const taskType = routeTaskByConfidence(70, 'medium') // Default confidence
    const result = await runLLMTask(taskType, messages, { temperature })
    return result.content
  } catch (error) {
    // Fallback to direct OpenAI call if router fails
    console.warn('[OpenAI] Model router failed, using direct call:', error.message)
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature,
    })
    return response.choices[0].message.content
  }
}



