import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/ai/agent_manager'
import { saveMemory } from '@/lib/memory'
import { classifyEmail } from '@/ai/email_classifier'

export async function POST(request) {
  try {
    const body = await request.json()
    
    // Verify webhook signature (implement based on your email provider)
    // For Gmail, you'd verify the X-Goog-Channel-Token header
    
    const { messageId, userId, from, to, subject, body: emailBody, htmlBody } = body

    if (!userId || !messageId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if email already processed
    const existingEmail = await prisma.email.findUnique({
      where: { messageId },
    })

    if (existingEmail) {
      return NextResponse.json({ message: 'Email already processed' })
    }

    // Save email to database
    const email = await prisma.email.create({
      data: {
        userId,
        messageId,
        from,
        to,
        subject,
        body: emailBody,
        htmlBody,
        status: 'UNREAD',
        isProcessed: false,
        metadata: body.metadata || {},
      },
    })

    // Classify email
    const classification = await classifyEmail(emailBody, subject, from)

    // Save email to memory
    await saveMemory(
      userId,
      `Email from ${from}: ${subject}\n${emailBody}`,
      {
        type: 'email',
        source: 'gmail',
        messageId,
        from,
        subject,
        category: classification.category,
        urgency: classification.urgency,
      }
    )

    // Process email with AI agent
    const agentResponse = await runAgent({
      userId,
      type: 'email',
      content: `Subject: ${subject}\n\n${emailBody}`,
      metadata: {
        messageId,
        from,
        to,
        subject,
        classification,
        needsFollowUp: classification.needsFollowUp,
      },
    })

    // Mark email as processed
    await prisma.email.update({
      where: { id: email.id },
      data: {
        isProcessed: true,
        extractedTasks: agentResponse.data?.tasks || [],
        aiReply: agentResponse.data?.reply || null,
        metadata: {
          classification,
          ...(email.metadata || {}),
        },
      },
    })

    return NextResponse.json({
      success: true,
      emailId: email.id,
      tasks: agentResponse.data?.tasks || [],
      reply: agentResponse.data?.reply,
      followUp: agentResponse.data?.followUp,
    })
  } catch (error) {
    console.error('Email webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

