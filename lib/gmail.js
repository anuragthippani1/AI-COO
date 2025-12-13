import { google } from 'googleapis'
import { prisma } from './prisma'

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:3000/api/auth/gmail/callback'
)

export function getGmailAuthUrl(userId) {
  const scopes = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
  ]

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: userId, // Pass userId in state for security
  })
}

export async function getGmailClient(accessToken, refreshToken) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
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

