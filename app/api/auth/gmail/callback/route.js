import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

// Get OAuth credentials with fallbacks
const getOAuthClient = () => {
  const clientId = process.env.GMAIL_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/gmail/callback`

  if (!clientId || !clientSecret) {
    throw new Error('Gmail OAuth credentials not configured')
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Handle OAuth errors from Google
    if (error) {
      console.error('OAuth error from Google:', {
        error,
        errorDescription,
        fullUrl: request.url,
      })
      
      let errorType = 'oauth_error'
      let message = errorDescription || error
      
      if (error === 'access_denied') {
        errorType = 'access_denied'
        message = 'Access was denied. This usually means:\n1. You did not click "Allow" on the consent screen\n2. Your email is not added as a test user in Google Cloud Console\n3. The OAuth consent screen is not properly configured'
      } else if (error === 'invalid_client') {
        errorType = 'invalid_client'
        message = 'Invalid OAuth client. Please check your GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env file'
      } else if (error === 'redirect_uri_mismatch') {
        errorType = 'redirect_uri_mismatch'
        const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
        message = `Redirect URI mismatch. Make sure the redirect URI in Google Console exactly matches:\n${redirectUri}`
      }
      
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=${errorType}&details=${encodeURIComponent(message)}`
      )
    }

    if (!code || !state) {
      console.error('Missing OAuth parameters:', { code: !!code, state: !!state, url: request.url })
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=missing_params&details=${encodeURIComponent('Missing code or state parameter from OAuth callback')}`
      )
    }

    // Get OAuth client
    const oauth2Client = getOAuthClient()

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    // Save or update account
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: state, // Using userId as providerAccountId for now
        },
      },
      update: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
      create: {
        userId: state,
        type: 'oauth',
        provider: 'google',
        providerAccountId: state,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
    })

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?success=gmail_connected`
    )
  } catch (error) {
    console.error('Gmail OAuth error:', error)
    
    // Extract error details for better user feedback
    let errorMessage = 'gmail_connection_failed'
    if (error.message?.includes('access_denied')) {
      errorMessage = 'access_denied'
    } else if (error.message?.includes('invalid_client')) {
      errorMessage = 'invalid_client'
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      errorMessage = 'redirect_uri_mismatch'
    }
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=${errorMessage}&details=${encodeURIComponent(error.message || 'Unknown error')}`
    )
  }
}

