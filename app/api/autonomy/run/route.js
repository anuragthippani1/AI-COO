import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runAutonomousMode } from '@/ai/autonomy_engine'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const config = body.config || {}

    const results = await runAutonomousMode(userId, config)

    return NextResponse.json({
      success: true,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Autonomous mode error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}










