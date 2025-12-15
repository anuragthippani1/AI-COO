import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { simulateAction } from '@/ai/simulation_engine'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { actionType, input } = body

    if (!actionType || !input) {
      return NextResponse.json(
        { error: 'Missing required fields: actionType, input' },
        { status: 400 }
      )
    }

    const simulation = await simulateAction(userId, actionType, input)

    return NextResponse.json({
      success: true,
      simulation: simulation.simulation,
      report: simulation.report,
    })
  } catch (error) {
    console.error('Simulate action error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


