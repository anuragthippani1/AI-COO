import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runAgent } from '@/ai/agent_manager'

export async function POST(request) {
  try {
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

    return NextResponse.json(response)
  } catch (error) {
    console.error('Agent run error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

