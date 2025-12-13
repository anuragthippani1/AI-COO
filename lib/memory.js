import { getPineconeIndex } from './pinecone'
import { getEmbedding } from './openai'
import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'

export async function saveMemory(userId, text, metadata = {}) {
  try {
    // Generate embedding
    const embedding = await getEmbedding(text)

    // Generate unique ID for Pinecone
    const pineconeId = `${userId}-${uuidv4()}`

    // Save to Pinecone
    const index = await getPineconeIndex()
    await index.upsert([
      {
        id: pineconeId,
        values: embedding,
        metadata: {
          userId,
          text: text.substring(0, 1000), // Store first 1000 chars in metadata
          ...metadata,
        },
      },
    ])

    // Save to database
    const memory = await prisma.memory.create({
      data: {
        userId,
        text,
        embedding: JSON.stringify(embedding),
        metadata: metadata,
        pineconeId,
      },
    })

    return memory.id
  } catch (error) {
    console.error('Error saving memory:', error)
    throw error
  }
}

export async function searchMemory(userId, query, topK = 5, filter) {
  try {
    // Generate query embedding
    const queryEmbedding = await getEmbedding(query)

    // Search Pinecone
    const index = await getPineconeIndex()
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK,
      includeMetadata: true,
      filter: {
        userId: { $eq: userId },
        ...filter,
      },
    })

    // Format results
    const results = queryResponse.matches.map((match) => ({
      text: match.metadata?.text || '',
      metadata: match.metadata,
      score: match.score || 0,
    }))

    return results
  } catch (error) {
    console.error('Error searching memory:', error)
    throw error
  }
}

export async function getMemoryContext(userId, query, maxTokens = 2000) {
  const memories = await searchMemory(userId, query, 10)
  
  // Build context string
  let context = ''
  for (const memory of memories) {
    const memoryText = `[${memory.metadata.type || 'memory'}]: ${memory.text}\n`
    if (context.length + memoryText.length > maxTokens) {
      break
    }
    context += memoryText
  }

  return context
}

