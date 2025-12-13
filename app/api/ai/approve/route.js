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

    // TODO: Execute the approved action
    // This would call the appropriate agent/function with actionData

    return NextResponse.json({
      success: true,
      approved: true,
      actionData: result.actionData,
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

