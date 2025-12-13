import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { generateWeeklySchedule } from '@/ai/business_operations'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    const schedule = await generateWeeklySchedule(userId)

    return NextResponse.json({
      success: true,
      schedule,
    })
  } catch (error) {
    console.error('Weekly schedule error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

