import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getGmailAuthUrl } from '@/lib/gmail'

// Test endpoint to verify OAuth configuration
export async function GET(request) {
  try {
    const userId = requireAuth(request)
    
    // Check environment variables (prefer GOOGLE_ prefix)
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET
    const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/oauth2callback'
    const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

    const config = {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'MISSING',
      redirectUri,
      nextAuthUrl,
    }

    // Try to generate auth URL
    let authUrl = null
    let authUrlError = null
    try {
      authUrl = getGmailAuthUrl(userId)
      config.authUrlGenerated = true
      config.authUrlPreview = authUrl.substring(0, 100) + '...'
    } catch (error) {
      authUrlError = error.message
      config.authUrlGenerated = false
    }

    return NextResponse.json({
      success: true,
      config,
      authUrl,
      authUrlError,
      instructions: {
        step1: 'Go to https://console.cloud.google.com/',
        step2: 'Navigate to APIs & Services → OAuth consent screen',
        step3: 'Make sure you\'ve added your email as a TEST USER',
        step4: 'Verify redirect URI EXACTLY matches: ' + redirectUri,
        step5: 'Add Authorized JavaScript Origins: http://localhost:3000',
        step5: 'Check that Gmail API and Calendar API are enabled',
      },
    })
  } catch (error) {
    console.error('Gmail test error:', error)
    return NextResponse.json(
      {
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}

