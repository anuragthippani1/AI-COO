import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { createCalendarEvent } from '@/lib/calendar'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { title, description, startTime, endTime, timeZone, attendees } = body

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: title, startTime, endTime' },
        { status: 400 }
      )
    }

    const event = await createCalendarEvent(userId, {
      title,
      description,
      startTime,
      endTime,
      timeZone,
      attendees,
    })

    return NextResponse.json({
      success: true,
      event,
    })
  } catch (error) {
    console.error('Create calendar event error:', error)
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


