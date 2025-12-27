import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runAgent } from '@/ai/agent_manager'
import { aiRateLimiter } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

export async function POST(request) {
  const requestId = request.headers.get('x-request-id') || 'unknown'
  
  try {
    // Rate limiting for AI endpoints (cost protection)
    const rateLimitResult = await aiRateLimiter(request)
    if (!rateLimitResult.success) {
      logger.warn('AI rate limit exceeded', { requestId })
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          },
        }
      )
    }

    const userId = requireAuth(request)
    const body = await request.json()

    const { type, content, metadata } = body

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing type or content' },
        { status: 400 }
      )
    }

    const response = await runAgent({
      userId,
      type,
      content,
      metadata,
    })

    logger.info('Agent run completed', { requestId, userId, type: body.type })
    return NextResponse.json(response)
  } catch (error) {
    logger.error('Agent run error', { requestId, error: error.message })
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

