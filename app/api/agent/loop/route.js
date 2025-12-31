import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { agentLoop } from '@/ai/agent_loop'

/**
 * Agent Loop Control API
 * Start/stop the agent loop for a user
 */
export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()
    const { action } = body // 'start' or 'stop'

    if (action === 'start') {
      agentLoop.start()
      return NextResponse.json({
        success: true,
        message: 'Agent loop started',
      })
    } else if (action === 'stop') {
      agentLoop.stop()
      return NextResponse.json({
        success: true,
        message: 'Agent loop stopped',
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Agent loop control error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request) {
  try {
    requireAuth(request)
    
    return NextResponse.json({
      success: true,
      isRunning: agentLoop.isRunning,
    })
  } catch (error) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}



