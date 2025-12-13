import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sendEmail } from '@/lib/gmail'

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

