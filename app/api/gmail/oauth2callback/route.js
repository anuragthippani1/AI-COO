import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

// Get OAuth credentials with full error logging
function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET
  const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/oauth2callback'

  console.log('[Gmail OAuth] Initializing OAuth client:', {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    redirectUri,
    clientIdPrefix: clientId ? clientId.substring(0, 20) + '...' : 'MISSING',
  })

  if (!clientId || !clientSecret) {
    const error = new Error('Gmail OAuth credentials not configured')
    console.error('[Gmail OAuth] Missing credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('GMAIL')),
    })
    throw error
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

    console.log('[Gmail OAuth] Callback received:', {
      hasCode: !!code,
      hasState: !!state,
      error,
      errorDescription,
      url: request.url,
    })

    // Handle OAuth errors from Google
    if (error) {
      console.error('[Gmail OAuth] Error from Google:', {
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
        message = 'Invalid OAuth client. Please check:\n1. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file\n2. The redirect URI in Google Console matches: http://localhost:3000/api/gmail/oauth2callback\n3. The OAuth client exists in Google Cloud Console'
      } else if (error === 'redirect_uri_mismatch') {
        errorType = 'redirect_uri_mismatch'
        const redirectUri = process.env.GMAIL_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/gmail/oauth2callback'
        message = `Redirect URI mismatch. Make sure the redirect URI in Google Console EXACTLY matches:\n${redirectUri}\n\nCheck for:\n- Missing http:// or https://\n- Extra slashes\n- Wrong port number\n- Case sensitivity`
      }
      
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=${errorType}&details=${encodeURIComponent(message)}`
      )
    }

    if (!code || !state) {
      console.error('[Gmail OAuth] Missing parameters:', { 
        code: !!code, 
        state: !!state, 
        url: request.url,
        searchParams: Object.fromEntries(searchParams.entries()),
      })
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=missing_params&details=${encodeURIComponent('Missing code or state parameter from OAuth callback')}`
      )
    }

    // Get OAuth client
    const oauth2Client = getOAuthClient()

    // Exchange code for tokens
    console.log('[Gmail OAuth] Exchanging code for tokens...')
    let tokens
    try {
      const tokenResponse = await oauth2Client.getToken(code)
      tokens = tokenResponse.tokens
      console.log('[Gmail OAuth] Tokens received:', {
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
        scopes: tokens.scope,
      })
    } catch (tokenError) {
      console.error('[Gmail OAuth] Token exchange failed:', {
        error: tokenError.message,
        code: code.substring(0, 20) + '...',
        stack: tokenError.stack,
      })
      throw new Error(`Token exchange failed: ${tokenError.message}`)
    }

    // Save or update account
    console.log('[Gmail OAuth] Saving account to database...')
    try {
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
      console.log('[Gmail OAuth] Account saved successfully')
    } catch (dbError) {
      console.error('[Gmail OAuth] Database error:', {
        error: dbError.message,
        userId: state,
        stack: dbError.stack,
      })
      throw new Error(`Failed to save account: ${dbError.message}`)
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?success=gmail_connected`
    )
  } catch (error) {
    console.error('[Gmail OAuth] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      url: request.url,
    })
    
    // Extract error details for better user feedback
    let errorMessage = 'gmail_connection_failed'
    if (error.message?.includes('access_denied')) {
      errorMessage = 'access_denied'
    } else if (error.message?.includes('invalid_client')) {
      errorMessage = 'invalid_client'
    } else if (error.message?.includes('redirect_uri_mismatch')) {
      errorMessage = 'redirect_uri_mismatch'
    } else if (error.message?.includes('Token exchange failed')) {
      errorMessage = 'token_exchange_failed'
    } else if (error.message?.includes('Failed to save account')) {
      errorMessage = 'database_error'
    }
    
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=${errorMessage}&details=${encodeURIComponent(error.message || 'Unknown error')}`
    )
  }
}









