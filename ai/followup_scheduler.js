import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { saveMemory } from '@/lib/memory'

export async function scheduleFollowUp(userId, contactInfo, context) {
  try {
    const prompt = `Based on this conversation context, determine if a follow-up is needed and when.

Context:
${context}

Contact: ${contactInfo}

If a follow-up is needed, return JSON with:
{
  "needed": true,
  "leadName": "Contact name",
  "leadPhone": "Phone if available",
  "leadEmail": "Email if available",
  "message": "Follow-up message draft",
  "scheduledFor": "ISO date string",
  "channel": "whatsapp" | "email" | "sms"
}

If no follow-up needed, return: {"needed": false}`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are a follow-up scheduling assistant. Determine when and how to follow up with leads.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const decision = JSON.parse(jsonMatch[0])
    if (!decision.needed) {
      return null
    }

    const followUp = {
      leadName: decision.leadName,
      leadPhone: decision.leadPhone,
      leadEmail: decision.leadEmail,
      message: decision.message,
      scheduledFor: new Date(decision.scheduledFor),
      channel: decision.channel || 'whatsapp',
    }

    // Save to database
    await prisma.followUp.create({
      data: {
        userId,
        leadName: followUp.leadName,
        leadPhone: followUp.leadPhone || '',
        leadEmail: followUp.leadEmail,
        message: followUp.message,
        scheduledFor: followUp.scheduledFor,
        channel: followUp.channel,
        status: 'pending',
      },
    })

    // Save to memory
    await saveMemory(userId, `Follow-up scheduled: ${followUp.leadName} - ${followUp.message}`, {
      type: 'followup',
      scheduledFor: followUp.scheduledFor.toISOString(),
      channel: followUp.channel,
    })

    return followUp
  } catch (error) {
    console.error('Error scheduling follow-up:', error)
    return null
  }
}

