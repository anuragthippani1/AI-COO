import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Check connected integrations
    const accounts = await prisma.account.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        type: true,
        scope: true,
        expires_at: true,
      },
    })

    // Check for Google account (Gmail + Calendar)
    const googleAccount = accounts.find((a) => a.provider === 'google')
    const hasGmail = !!googleAccount
    const hasCalendar = googleAccount?.scope?.includes('calendar') || false

    // Check WhatsApp (would need separate storage or check env vars)
    const hasWhatsApp = !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID)

    const integrations = {
      gmail: {
        connected: hasGmail,
        account: googleAccount ? {
          id: googleAccount.id,
          expiresAt: googleAccount.expires_at,
          scopes: googleAccount.scope?.split(' ') || [],
        } : null,
      },
      calendar: {
        connected: hasCalendar,
        account: hasCalendar ? googleAccount : null,
      },
      whatsapp: {
        connected: hasWhatsApp,
        configured: hasWhatsApp,
      },
    }

    return NextResponse.json({
      success: true,
      integrations,
      accounts,
    })
  } catch (error) {
    console.error('Get integrations error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

