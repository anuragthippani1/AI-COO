import { google } from 'googleapis'
import { prisma } from './prisma'

// Get OAuth credentials with fallbacks and full error logging
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
    const error = new Error('Gmail OAuth credentials not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env')
    console.error('[Gmail OAuth] Missing credentials:', {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      envKeys: Object.keys(process.env).filter(k => k.includes('GOOGLE') || k.includes('GMAIL')),
    })
    throw error
  }

  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

export function getGmailAuthUrl(userId) {
  try {
    // Reinitialize client to ensure credentials are loaded
    const client = getOAuthClient()
    
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/calendar.events',
    ]

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent',
      state: userId, // Pass userId in state for security
    })

    console.log('[Gmail OAuth] Generated auth URL:', {
      userId,
      redirectUri: client.redirectUri,
      scopesCount: scopes.length,
      urlLength: authUrl.length,
    })

    return authUrl
  } catch (error) {
    console.error('[Gmail OAuth] Error generating auth URL:', {
      error: error.message,
      stack: error.stack,
    })
    throw new Error('Gmail OAuth not configured. Please check your .env file for GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET')
  }
}

export async function getGmailClient(accessToken, refreshToken) {
  try {
    const client = getOAuthClient()
    client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    return google.gmail({ version: 'v1', auth: client })
  } catch (error) {
    console.error('Error getting Gmail client:', error)
    throw error
  }
}

export async function fetchEmails(userId, maxResults = 10) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    })

    if (!account || !account.access_token) {
      throw new Error('Gmail not connected')
    }

    const gmail = await getGmailClient(account.access_token, account.refresh_token)

    // Fetch messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'is:unread',
    })

    const messages = response.data.messages || []
    const emailData = []

    for (const message of messages) {
      const msg = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full',
      })

      const headers = msg.data.payload.headers
      const from = headers.find((h) => h.name === 'From')?.value || ''
      const to = headers.find((h) => h.name === 'To')?.value || ''
      const subject = headers.find((h) => h.name === 'Subject')?.value || ''
      const date = headers.find((h) => h.name === 'Date')?.value || ''

      // Extract body
      let body = ''
      let htmlBody = ''
      const extractBody = (part) => {
        if (part.body?.data) {
          const text = Buffer.from(part.body.data, 'base64').toString('utf-8')
          if (part.mimeType === 'text/plain') {
            body = text
          } else if (part.mimeType === 'text/html') {
            htmlBody = text
          }
        }
        if (part.parts) {
          part.parts.forEach(extractBody)
        }
      }
      extractBody(msg.data.payload)

      emailData.push({
        messageId: message.id,
        threadId: msg.data.threadId,
        from,
        to,
        subject,
        body: body || htmlBody.replace(/<[^>]*>/g, ''),
        htmlBody,
        receivedAt: new Date(date),
      })
    }

    return emailData
  } catch (error) {
    console.error('Error fetching emails:', error)
    throw error
  }
}

export async function sendEmail(userId, to, subject, body, htmlBody = null) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'google',
      },
    })

    if (!account || !account.access_token) {
      throw new Error('Gmail not connected')
    }

    const gmail = await getGmailClient(account.access_token, account.refresh_token)

    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody || body,
    ].join('\n')

    const encodedEmail = Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedEmail,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}
