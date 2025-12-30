import axios from 'axios'

// Using Twilio as example - can be replaced with any SMS provider
const TWILIO_API_URL = process.env.TWILIO_API_URL || 'https://api.twilio.com/2010-04-01'

export async function sendSMS(phoneNumber, message) {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const fromNumber = process.env.TWILIO_PHONE_NUMBER

    if (!accountSid || !authToken || !fromNumber) {
      console.warn('Twilio credentials not configured - SMS not sent')
      return false
    }

    // Format phone number
    const formattedPhone = phoneNumber.replace(/[^0-9+]/g, '')

    const response = await axios.post(
      `${TWILIO_API_URL}/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: formattedPhone,
        From: fromNumber,
        Body: message,
      }),
      {
        auth: {
          username: accountSid,
          password: authToken,
        },
      }
    )

    return response.status === 201
  } catch (error) {
    console.error('SMS send error:', error.response?.data || error.message)
    return false
  }
}

export async function draftSMS(userId, context, recipient) {
  try {
    // This would use AI to draft SMS based on context
    // For now, return a simple draft
    return {
      message: `Hi ${recipient.name || 'there'}, ${context.message || 'Just following up on our conversation.'}`,
      suggestedTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
    }
  } catch (error) {
    console.error('Error drafting SMS:', error)
    throw error
  }
}









