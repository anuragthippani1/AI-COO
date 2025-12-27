import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { runAutonomyLoop } from '@/ai/autonomy_loop'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const config = body.config || {}

    const result = await runAutonomyLoop(userId, config)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Autonomy loop error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






