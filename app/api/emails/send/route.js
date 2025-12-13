import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/gmail'
import { saveDeepMemory } from '@/lib/memory_deep'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const { to, subject, body, htmlBody } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
    }

    const result = await sendEmail(userId, to, subject, body, htmlBody)

    // Save user's sent email to memory for style learning
    // This is the final version the user sent (after any edits)
    try {
      await saveDeepMemory(userId, {
        text: body || htmlBody || '',
        type: 'user_reply',
        metadata: {
          to,
          subject,
          messageId: result.id,
          sentAt: new Date().toISOString(),
          isTrainingExample: true, // Mark as training example
        },
        priority: 'high', // High priority for style learning
      })
      console.log(`[Email Send] Saved user reply to memory for style learning`)
    } catch (memoryError) {
      // Don't fail the email send if memory save fails
      console.error('[Email Send] Error saving to memory:', memoryError)
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
    })
  } catch (error) {
    console.error('Send email error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message === 'Gmail not connected') {
      return NextResponse.json(
        { error: 'Gmail not connected' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

