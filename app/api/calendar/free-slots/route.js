import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { findFreeTimeSlots } from '@/lib/calendar'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const duration = parseInt(searchParams.get('duration') || '30') // minutes
    const timeMin = searchParams.get('timeMin') || new Date().toISOString()
    const timeMax = searchParams.get('timeMax') || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const freeSlots = await findFreeTimeSlots(userId, duration, timeMin, timeMax)

    return NextResponse.json({
      success: true,
      freeSlots,
    })
  } catch (error) {
    console.error('Find free slots error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Google Calendar not connected') {
      return NextResponse.json(
        { error: 'Google Calendar not connected' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}









