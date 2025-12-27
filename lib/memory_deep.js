import { getPineconeIndex } from './pinecone'
import { getEmbedding } from './openai'
import { prisma } from './prisma'
import { v4 as uuidv4 } from 'uuid'

/**
 * Deep Memory Engine
 * Enhanced memory with short-term cache, long-term memory, ranking, and temporal decay
 */

// Short-term cache (in-memory, recent data)
const shortTermCache = new Map()

// Cache TTL: 1 hour
const CACHE_TTL = 60 * 60 * 1000

/**
 * Save deep memory with enhanced metadata
 */
export async function saveDeepMemory(userId, data) {
  try {
    const {
      text,
      type = 'general',
      metadata = {},
      priority = 'medium',
      expiresAt = null,
    } = data

    if (!text || !userId) {
      throw new Error('Text and userId are required')
    }

    // Generate embedding
    const embedding = await getEmbedding(text)

    // Generate unique ID
    const memoryId = `${userId}-${uuidv4()}`
    const timestamp = new Date()

    // Calculate relevance score based on priority and recency
    const relevanceScore = calculateRelevanceScore(priority, timestamp, expiresAt)

    // Prepare metadata with enhanced information
    const enhancedMetadata = {
      userId,
      text: text.substring(0, 2000), // Store first 2000 chars
      type,
      priority,
      relevanceScore,
      timestamp: timestamp.toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      ...metadata,
    }

    // Save to Pinecone
    const index = await getPineconeIndex()
    await index.upsert([
      {
        id: memoryId,
        values: embedding,
        metadata: enhancedMetadata,
      },
    ])

    // Save to database
    const memory = await prisma.memory.create({
      data: {
        userId,
        text,
        embedding: JSON.stringify(embedding),
        metadata: enhancedMetadata,
        pineconeId: memoryId,
      },
    })

    // Add to short-term cache
    addToShortTermCache(userId, {
      id: memory.id,
      text,
      metadata: enhancedMetadata,
      timestamp,
    })

    return {
      success: true,
      memoryId: memory.id,
      pineconeId: memoryId,
    }
  } catch (error) {
    console.error('Error saving deep memory:', error)
    throw error
  }
}

/**
 * Search deep memory with advanced options
 */
export async function searchDeepMemory(userId, query, options = {}) {
  try {
    const {
      limit = 10,
      type = null,
      minRelevance = 0.5,
      includeExpired = false,
      useCache = true,
    } = options

    // Check short-term cache first
    if (useCache) {
      const cached = getFromShortTermCache(userId, query)
      if (cached && cached.length > 0) {
        return cached.slice(0, limit)
      }
    }

    // Generate query embedding
    const queryEmbedding = await getEmbedding(query)

    // Build filter
    const filter = {
      userId: { $eq: userId },
    }

    if (type) {
      filter.type = { $eq: type }
    }

    if (!includeExpired) {
      const now = new Date().toISOString()
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ]
    }

    // Search Pinecone
    const index = await getPineconeIndex()
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: limit * 2, // Get more to filter by relevance
      includeMetadata: true,
      filter,
    })

    // Filter and rank results
    let results = queryResponse.matches
      .map((match) => ({
        text: match.metadata?.text || '',
        metadata: match.metadata,
        score: match.score || 0,
        relevanceScore: match.metadata?.relevanceScore || 0.5,
        combinedScore:
          (match.score || 0) * 0.7 + (match.metadata?.relevanceScore || 0.5) * 0.3,
      }))
      .filter((r) => r.combinedScore >= minRelevance)

    // Apply temporal decay
    results = applyTemporalDecay(results)

    // Sort by combined score
    results.sort((a, b) => b.combinedScore - a.combinedScore)

    // Return top results
    return results.slice(0, limit)
  } catch (error) {
    console.error('Error searching deep memory:', error)
    throw error
  }
}

/**
 * Calculate relevance score
 */
function calculateRelevanceScore(priority, timestamp, expiresAt) {
  let score = 0.5 // Base score

  // Priority boost
  const priorityBoost = {
    high: 0.3,
    medium: 0.15,
    low: 0.05,
    urgent: 0.4,
  }
  score += priorityBoost[priority] || 0.15

  // Recency boost (more recent = higher score)
  const age = Date.now() - new Date(timestamp).getTime()
  const daysOld = age / (24 * 60 * 60 * 1000)
  const recencyBoost = Math.max(0, 0.2 * (1 - daysOld / 30)) // Decay over 30 days
  score += recencyBoost

  // Expiration penalty
  if (expiresAt) {
    const expiresIn = new Date(expiresAt).getTime() - Date.now()
    if (expiresIn < 0) {
      score *= 0.1 // Heavily penalize expired
    } else {
      const daysUntilExpiry = expiresIn / (24 * 60 * 60 * 1000)
      if (daysUntilExpiry < 1) {
        score += 0.2 // Boost for soon-to-expire
      }
    }
  }

  return Math.min(1.0, Math.max(0.0, score))
}

/**
 * Apply temporal decay to search results
 */
function applyTemporalDecay(results) {
  const now = Date.now()
  return results.map((result) => {
    if (!result.metadata?.timestamp) return result

    const age = now - new Date(result.metadata.timestamp).getTime()
    const daysOld = age / (24 * 60 * 60 * 1000)

    // Decay factor: 0.95^days (5% decay per day)
    const decayFactor = Math.pow(0.95, daysOld)
    result.combinedScore *= decayFactor

    return result
  })
}

/**
 * Short-term cache management
 */
function addToShortTermCache(userId, memory) {
  if (!shortTermCache.has(userId)) {
    shortTermCache.set(userId, [])
  }

  const userCache = shortTermCache.get(userId)
  userCache.push({
    ...memory,
    cachedAt: Date.now(),
  })

  // Limit cache size (keep last 100 items)
  if (userCache.length > 100) {
    userCache.shift()
  }

  // Clean expired entries periodically
  setTimeout(() => cleanShortTermCache(userId), CACHE_TTL)
}

function getFromShortTermCache(userId, query) {
  const userCache = shortTermCache.get(userId)
  if (!userCache) return null

  // Filter by query (simple text matching)
  const queryLower = query.toLowerCase()
  return userCache
    .filter((item) => {
      // Check if not expired
      if (Date.now() - item.cachedAt > CACHE_TTL) return false
      // Simple text match
      return item.text.toLowerCase().includes(queryLower)
    })
    .map((item) => ({
      text: item.text,
      metadata: item.metadata,
      score: 0.9, // High score for cache hits
      relevanceScore: item.metadata.relevanceScore || 0.5,
      combinedScore: 0.9,
    }))
}

function cleanShortTermCache(userId) {
  const userCache = shortTermCache.get(userId)
  if (!userCache) return

  const now = Date.now()
  const cleaned = userCache.filter((item) => now - item.cachedAt < CACHE_TTL)
  shortTermCache.set(userId, cleaned)
}

/**
 * Get memory context with ranking
 */
export async function getDeepMemoryContext(userId, query, maxTokens = 2000) {
  const memories = await searchDeepMemory(userId, query, {
    limit: 20,
    minRelevance: 0.3,
  })

  // Build context string
  let context = ''
  let tokenCount = 0

  for (const memory of memories) {
    const memoryText = `[${memory.metadata.type || 'memory'} - Relevance: ${memory.combinedScore.toFixed(2)}]: ${memory.text}\n`
    const estimatedTokens = memoryText.length / 4 // Rough estimate

    if (tokenCount + estimatedTokens > maxTokens) {
      break
    }

    context += memoryText
    tokenCount += estimatedTokens
  }

  return context
}

/**
 * Update memory relevance
 */
export async function updateMemoryRelevance(userId, memoryId, newRelevance) {
  try {
    // Update in database
    await prisma.memory.updateMany({
      where: {
        id: memoryId,
        userId,
      },
      data: {
        metadata: {
          // Preserve existing metadata, update relevance
          ...(await prisma.memory.findUnique({ where: { id: memoryId } })).metadata,
          relevanceScore: newRelevance,
        },
      },
    })

    // Update in Pinecone if we have pineconeId
    const memory = await prisma.memory.findUnique({
      where: { id: memoryId },
    })

    if (memory?.pineconeId) {
      const index = await getPineconeIndex()
      // Note: Pinecone doesn't support partial updates easily
      // Would need to re-upsert with updated metadata
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating memory relevance:', error)
    throw error
  }
}







