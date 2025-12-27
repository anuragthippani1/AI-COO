// Email service wrapper for transactional emails
// Supports Resend, SendGrid, or SMTP

let emailService = null

export async function sendEmail({ to, subject, html, text }) {
  // Try Resend first (recommended)
  if (process.env.RESEND_API_KEY) {
    return sendViaResend({ to, subject, html, text })
  }

  // Try SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return sendViaSendGrid({ to, subject, html, text })
  }

  // Try Mailgun
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return sendViaMailgun({ to, subject, html, text })
  }

  // Fallback: Log in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Email Service] Email would be sent:', { to, subject })
    return { success: true, message: 'Email logged (no service configured)' }
  }

  throw new Error('No email service configured. Please set RESEND_API_KEY, SENDGRID_API_KEY, or MAILGUN_API_KEY')
}

async function sendViaResend({ to, subject, html, text }) {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'AI COO <onboarding@resend.dev>',
        to,
        subject,
        html,
        text,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send email via Resend')
    }

    const data = await response.json()
    return { success: true, id: data.id }
  } catch (error) {
    console.error('Resend error:', error)
    throw error
  }
}

async function sendViaSendGrid({ to, subject, html, text }) {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: process.env.SENDGRID_FROM_EMAIL || 'noreply@example.com' },
        subject,
        content: [
          { type: 'text/html', value: html },
          { type: 'text/plain', value: text },
        ],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Failed to send email via SendGrid')
    }

    return { success: true }
  } catch (error) {
    console.error('SendGrid error:', error)
    throw error
  }
}

async function sendViaMailgun({ to, subject, html, text }) {
  try {
    const formData = new URLSearchParams()
    formData.append('from', process.env.MAILGUN_FROM_EMAIL || `AI COO <noreply@${process.env.MAILGUN_DOMAIN}>`)
    formData.append('to', to)
    formData.append('subject', subject)
    formData.append('html', html)
    formData.append('text', text)

    const response = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'Failed to send email via Mailgun')
    }

    const data = await response.json()
    return { success: true, id: data.id }
  } catch (error) {
    console.error('Mailgun error:', error)
    throw error
  }
}

