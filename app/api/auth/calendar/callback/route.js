import { NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID || process.env.GMAIL_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET || process.env.GMAIL_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/calendar/callback'
)

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // userId

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=missing_params`
      )
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code)

    // Update account with calendar scope (same account as Gmail)
    await prisma.account.updateMany({
      where: {
        userId: state,
        provider: 'google',
      },
      data: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : null,
        token_type: tokens.token_type,
        scope: tokens.scope,
      },
    })

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?success=calendar_connected`
    )
  } catch (error) {
    console.error('Calendar OAuth error:', error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/settings?error=calendar_connection_failed`
    )
  }
}


