import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { fetchEmails } from '@/lib/gmail'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/ai/agent_manager'
import { saveMemory } from '@/lib/memory'
import { processWorkflowTrigger } from '@/lib/workflow_engine'
import { processAutoResponse } from '@/ai/auto_response'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Fetch emails from Gmail
    const emails = await fetchEmails(userId, 20)

    // Process each email
    const processedEmails = []
    for (const email of emails) {
      // Check if email already exists
      const existing = await prisma.email.findUnique({
        where: { messageId: email.messageId },
      })

      if (existing) {
        processedEmails.push(existing)
        continue
      }

      // Save email to database
      const savedEmail = await prisma.email.create({
        data: {
          userId,
          messageId: email.messageId,
          threadId: email.threadId,
          from: email.from,
          to: email.to,
          subject: email.subject,
          body: email.body,
          htmlBody: email.htmlBody,
          status: 'UNREAD',
          isProcessed: false,
          receivedAt: email.receivedAt,
        },
      })

      // Save to memory
      await saveMemory(
        userId,
        `Email from ${email.from}: ${email.subject}\n${email.body}`,
        {
          type: 'email',
          source: 'gmail',
          messageId: email.messageId,
          from: email.from,
          subject: email.subject,
        }
      )

      // Check for auto-response first
      const autoResponse = await processAutoResponse(
        userId,
        email.body,
        'email',
        {
          from: email.from,
          subject: email.subject,
        }
      )

      // Process with autonomous inbox automation
      // This automatically classifies, extracts tasks, generates replies, and schedules follow-ups
      const { processInboxEmail } = await import('@/ai/inbox_automation')
      const automationResult = await processInboxEmail(userId, savedEmail)

      // If automation didn't process (already processed or error), fall back to basic agent
      if (!automationResult.success || automationResult.alreadyProcessed) {
        const agentResponse = await runAgent({
          userId,
          type: 'email',
          content: `Subject: ${email.subject}\n\n${email.body}`,
          metadata: {
            messageId: email.messageId,
            from: email.from,
            to: email.to,
            subject: email.subject,
            autoResponseMatched: autoResponse.matched,
          },
        })

        // Update email with AI processing results
        await prisma.email.update({
          where: { id: savedEmail.id },
          data: {
            isProcessed: true,
            extractedTasks: agentResponse.data?.tasks || [],
            aiReply: agentResponse.data?.reply || null,
          },
        })
      }

      // Trigger workflows for email_received
      await processWorkflowTrigger(userId, 'email_received', {
        emailId: savedEmail.id,
        messageId: email.messageId,
        from: email.from,
        subject: email.subject,
      })

      processedEmails.push({
        ...savedEmail,
        extractedTasks: agentResponse.data?.tasks || [],
        aiReply: agentResponse.data?.reply,
      })
    }

    return NextResponse.json({
      success: true,
      emails: processedEmails,
      count: processedEmails.length,
    })
  } catch (error) {
    console.error('Fetch emails error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Gmail not connected') {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect your Gmail account in settings.' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

