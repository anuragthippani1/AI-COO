import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { approveAction } from '@/lib/approval_manager'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { approvalRequestId } = body

    if (!approvalRequestId) {
      return NextResponse.json(
        { error: 'Approval request ID is required' },
        { status: 400 }
      )
    }

    const result = await approveAction(userId, approvalRequestId)

    if (!result.approved) {
      return NextResponse.json(
        { error: result.error || 'Failed to approve action' },
        { status: 400 }
      )
    }

    // Action is already executed by approveAction
    // Emit event for agent loop to handle post-approval actions
    const { eventSystem, EVENTS } = await import('@/lib/event_system')
    await eventSystem.emit(EVENTS.USER_APPROVAL_RECEIVED, userId, {
      approvalRequestId,
      actionData: result.actionData,
      result: result.result,
    })

    return NextResponse.json({
      success: true,
      approved: true,
      actionData: result.actionData,
      result: result.result,
    })
  } catch (error) {
    console.error('Approve action error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








