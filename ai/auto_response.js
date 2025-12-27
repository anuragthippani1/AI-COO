import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/gmail'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendSMS } from '@/lib/sms'

export async function processAutoResponse(userId, message, channel, metadata = {}) {
  try {
    // Get active auto-responses
    const autoResponses = await prisma.autoResponse.findMany({
      where: {
        userId,
        isActive: true,
        channel: channel || 'email',
      },
    })

    // Check if message matches any pattern
    for (const autoResponse of autoResponses) {
      const pattern = new RegExp(autoResponse.pattern, 'i')
      if (pattern.test(message)) {
        // Send auto-response
        await sendAutoResponse(userId, autoResponse, message, channel, metadata)
        return {
          matched: true,
          responseId: autoResponse.id,
          response: autoResponse.response,
        }
      }
    }

    // If no pattern matches, check for common questions using AI
    const aiResponse = await generateAutoResponse(userId, message, channel)
    if (aiResponse.shouldRespond) {
      return {
        matched: true,
        responseId: 'ai_generated',
        response: aiResponse.message,
        suggested: true, // User should review before sending
      }
    }

    return { matched: false }
  } catch (error) {
    console.error('Error processing auto-response:', error)
    return { matched: false }
  }
}

async function sendAutoResponse(userId, autoResponse, originalMessage, channel, metadata) {
  try {
    const response = autoResponse.response

    switch (channel) {
      case 'email':
        if (metadata.from) {
          await sendEmail(userId, metadata.from, 'Re: ' + (metadata.subject || 'Your inquiry'), response)
        }
        break

      case 'whatsapp':
        if (metadata.phone) {
          await sendWhatsAppMessage(metadata.phone, response)
        }
        break

      case 'sms':
        if (metadata.phone) {
          await sendSMS(metadata.phone, response)
        }
        break
    }
  } catch (error) {
    console.error('Error sending auto-response:', error)
  }
}

async function generateAutoResponse(userId, message, channel) {
  try {
    const prompt = `Analyze this message and determine if it needs an auto-response.

Message: ${message}
Channel: ${channel}

Common questions that need auto-responses:
- Pricing inquiries
- Availability questions
- FAQ questions
- Simple requests

Return JSON:
{
  "shouldRespond": true|false,
  "message": "Response message if shouldRespond is true",
  "confidence": 0.0-1.0
}`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are an auto-response assistant. Determine if messages need automatic responses.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { shouldRespond: false }
    }

    return JSON.parse(jsonMatch[0])
  } catch (error) {
    console.error('Error generating auto-response:', error)
    return { shouldRespond: false }
  }
}






