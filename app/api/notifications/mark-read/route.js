import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { markNotificationRead } from '@/lib/notifications'

export async function PUT(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { notificationId } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      )
    }

    await markNotificationRead(userId, notificationId)

    return NextResponse.json({
      success: true,
    })
  } catch (error) {
    console.error('Mark notification read error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









