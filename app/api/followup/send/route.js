import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { generateReply } from '@/ai/reply_generator'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { followUpId } = body

    if (!followUpId) {
      return NextResponse.json(
        { error: 'Missing followUpId' },
        { status: 400 }
      )
    }

    // Get follow-up
    const followUp = await prisma.followUp.findFirst({
      where: {
        id: followUpId,
        userId,
        status: 'pending',
      },
    })

    if (!followUp) {
      return NextResponse.json(
        { error: 'Follow-up not found or already sent' },
        { status: 404 }
      )
    }

    // Check if it's time to send
    if (new Date(followUp.scheduledFor) > new Date()) {
      return NextResponse.json(
        { error: 'Follow-up is scheduled for later' },
        { status: 400 }
      )
    }

    // Generate personalized message if needed
    let message = followUp.message
    if (!message || message.trim() === '') {
      message = await generateReply(
        userId,
        `Follow-up for ${followUp.leadName}`,
        {
          leadName: followUp.leadName,
          leadEmail: followUp.leadEmail,
        }
      )
    }

    // Send via appropriate channel
    let sent = false
    if (followUp.channel === 'whatsapp' && followUp.leadPhone) {
      sent = await sendWhatsAppMessage(followUp.leadPhone, message)
    } else if (followUp.channel === 'email' && followUp.leadEmail) {
      // Implement email sending
      sent = true // Placeholder
    }

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send follow-up' },
        { status: 500 }
      )
    }

    // Update follow-up status
    const updated = await prisma.followUp.update({
      where: { id: followUp.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        conversationHistory: [
          ...(followUp.conversationHistory || []),
          {
            role: 'assistant',
            message,
            sentAt: new Date().toISOString(),
          },
        ],
      },
    })

    return NextResponse.json({
      success: true,
      followUp: updated,
    })
  } catch (error) {
    console.error('Follow-up send error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

