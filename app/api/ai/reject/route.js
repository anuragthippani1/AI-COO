import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { rejectAction } from '@/lib/approval_manager'
import { recordRejection } from '@/ai/safety_guard'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { approvalRequestId, reason } = body

    if (!approvalRequestId) {
      return NextResponse.json(
        { error: 'Approval request ID is required' },
        { status: 400 }
      )
    }

    const result = await rejectAction(userId, approvalRequestId, reason || 'User rejected')

    if (!result.rejected) {
      return NextResponse.json(
        { error: result.error || 'Failed to reject action' },
        { status: 400 }
      )
    }

    // Record rejection for safety guard
    // TODO: Extract actionType from approval request
    await recordRejection(userId, 'unknown', reason || 'User rejected')

    return NextResponse.json({
      success: true,
      rejected: true,
    })
  } catch (error) {
    console.error('Reject action error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








