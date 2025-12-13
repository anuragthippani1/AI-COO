import { getChatCompletion } from '@/lib/openai'
import { createCalendarEvent, findFreeTimeSlots } from '@/lib/calendar'
import { getMemoryContext } from '@/lib/memory'

export async function scheduleMeeting(userId, request, preferences = {}) {
  try {
    // Get user's scheduling preferences from memory
    const schedulingContext = await getMemoryContext(userId, 'scheduling preferences availability', 500)

    const prompt = `Based on this meeting request, suggest the best time and create a calendar event.

Meeting Request:
${request}

${schedulingContext ? `User Preferences:\n${schedulingContext}` : ''}

Determine:
1. Meeting duration (default: 30 minutes)
2. Preferred time slots
3. Meeting title
4. Description
5. Required attendees

Return JSON:
{
  "title": "Meeting title",
  "description": "Meeting description",
  "duration": 30,
  "preferredTimes": ["2024-01-15T10:00:00Z", "2024-01-15T14:00:00Z"],
  "attendees": ["email@example.com"],
  "priority": "high|medium|low"
}`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are a scheduling assistant. Analyze meeting requests and suggest optimal times.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse scheduling response')
    }

    const schedulingData = JSON.parse(jsonMatch[0])

    // Find free time slots
    const timeMin = new Date().toISOString()
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const freeSlots = await findFreeTimeSlots(userId, schedulingData.duration, timeMin, timeMax)

    // Select best available slot
    let selectedSlot = freeSlots[0]
    if (schedulingData.preferredTimes && freeSlots.length > 0) {
      // Try to match preferred times
      for (const preferred of schedulingData.preferredTimes) {
        const preferredDate = new Date(preferred)
        const matchingSlot = freeSlots.find((slot) => {
          const slotStart = new Date(slot.start)
          const diff = Math.abs(slotStart.getTime() - preferredDate.getTime())
          return diff < 2 * 60 * 60 * 1000 // Within 2 hours
        })
        if (matchingSlot) {
          selectedSlot = matchingSlot
          break
        }
      }
    }

    if (!selectedSlot) {
      throw new Error('No available time slots found')
    }

    // Create calendar event
    const startTime = selectedSlot.start
    const endTime = new Date(new Date(startTime).getTime() + schedulingData.duration * 60 * 1000).toISOString()

    const event = await createCalendarEvent(userId, {
      title: schedulingData.title,
      description: schedulingData.description || '',
      startTime,
      endTime,
      attendees: schedulingData.attendees || [],
    })

    return {
      success: true,
      event,
      suggestedTime: startTime,
    }
  } catch (error) {
    console.error('Error scheduling meeting:', error)
    throw error
  }
}

