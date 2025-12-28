import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { canRollback, rollbackAction } from '@/lib/rollback_manager'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const activityLogId = searchParams.get('id')

    if (!activityLogId) {
      return NextResponse.json(
        { error: 'Activity log ID is required' },
        { status: 400 }
      )
    }

    const check = await canRollback(activityLogId)

    return NextResponse.json({
      success: true,
      canRollback: check.canRollback,
      reason: check.reason,
      timeRemaining: check.timeRemaining,
    })
  } catch (error) {
    console.error('Check rollback error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { activityLogId } = body

    if (!activityLogId) {
      return NextResponse.json(
        { error: 'Activity log ID is required' },
        { status: 400 }
      )
    }

    const result = await rollbackAction(userId, activityLogId)

    return NextResponse.json({
      success: result.success,
      message: result.message,
    })
  } catch (error) {
    console.error('Rollback action error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








