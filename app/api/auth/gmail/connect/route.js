import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    const authUrl = getGmailAuthUrl(userId)

    return NextResponse.json({
      success: true,
      authUrl,
    })
  } catch (error) {
    console.error('Gmail connect error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

