import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getGmailAuthUrl } from '@/lib/gmail'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    
    // Check if credentials are configured (prefer GOOGLE_ prefix)
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET
    const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/oauth2callback'

    console.log('[Gmail Connect] Checking credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
    })

    if (!clientId || !clientSecret) {
      console.error('[Gmail Connect] Missing credentials:', {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
        envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('GMAIL')),
      })
      return NextResponse.json(
        {
          error: 'Gmail OAuth not configured',
          message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env file.\n\nAlso set GMAIL_REDIRECT_URI=http://localhost:3000/api/gmail/oauth2callback\n\nSee GMAIL_SETUP_GUIDE.md for instructions.',
          setupRequired: true,
          redirectUri,
        },
        { status: 400 }
      )
    }

    const authUrl = getGmailAuthUrl(userId)

    console.log('[Gmail Connect] Auth URL generated successfully:', {
      userId,
      urlLength: authUrl.length,
      redirectUri,
    })

    return NextResponse.json({
      success: true,
      authUrl,
      redirectUri, // Return for debugging
    })
  } catch (error) {
    console.error('Gmail connect error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (error.message.includes('not configured')) {
      return NextResponse.json(
        {
          error: error.message,
          setupRequired: true,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

