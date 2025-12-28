import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { listCalendarEvents } from '@/lib/calendar'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const timeMin = searchParams.get('timeMin') || new Date().toISOString()
    const timeMax = searchParams.get('timeMax')

    const events = await listCalendarEvents(userId, timeMin, timeMax)

    return NextResponse.json({
      success: true,
      events,
    })
  } catch (error) {
    console.error('List calendar events error:', error)
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








