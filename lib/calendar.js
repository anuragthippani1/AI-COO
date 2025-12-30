import { google } from 'googleapis'
import { prisma } from './prisma'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/calendar/callback'
)

export async function getCalendarClient(userId) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    })

    if (!account || !account.access_token) {
      throw new Error('Google Calendar not connected')
    }

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token,
    })

    return google.calendar({ version: 'v3', auth: oauth2Client })
  } catch (error) {
    console.error('Error getting calendar client:', error)
    throw error
  }
}

export async function createCalendarEvent(userId, eventData) {
  try {
    const calendar = await getCalendarClient(userId)

    const event = {
      summary: eventData.title,
      description: eventData.description || '',
      start: {
        dateTime: eventData.startTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      end: {
        dateTime: eventData.endTime,
        timeZone: eventData.timeZone || 'UTC',
      },
      attendees: eventData.attendees || [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 10 },
        ],
      },
    }

    const response = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
    })

    return response.data
  } catch (error) {
    console.error('Error creating calendar event:', error)
    throw error
  }
}

export async function listCalendarEvents(userId, timeMin, timeMax) {
  try {
    const calendar = await getCalendarClient(userId)

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  } catch (error) {
    console.error('Error listing calendar events:', error)
    throw error
  }
}

export async function findFreeTimeSlots(userId, duration, timeMin, timeMax) {
  try {
    const calendar = await getCalendarClient(userId)

    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: [{ id: 'primary' }],
      },
    })

    const busy = response.data.calendars?.primary?.busy || []
    
    // Find free slots (simplified - in production, use a proper algorithm)
    const freeSlots = []
    let currentTime = new Date(timeMin)

    for (const busyPeriod of busy) {
      const busyStart = new Date(busyPeriod.start)
      const busyEnd = new Date(busyPeriod.end)

      if (currentTime < busyStart) {
        const slotDuration = busyStart.getTime() - currentTime.getTime()
        if (slotDuration >= duration * 60 * 1000) {
          freeSlots.push({
            start: currentTime.toISOString(),
            end: busyStart.toISOString(),
          })
        }
      }
      currentTime = busyEnd > currentTime ? busyEnd : currentTime
    }

    return freeSlots
  } catch (error) {
    console.error('Error finding free time slots:', error)
    throw error
  }
}









