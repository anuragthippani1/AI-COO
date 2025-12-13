import axios from 'axios'

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'

export async function sendWhatsAppMessage(phoneNumber, message) {
  try {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.warn('WhatsApp credentials not configured - message not sent')
      return false
    }

    // Format phone number (remove + and ensure country code)
    const formattedPhone = phoneNumber.replace(/[^0-9]/g, '')

    if (!formattedPhone || formattedPhone.length < 10) {
      throw new Error('Invalid phone number format')
    }

    const response = await axios.post(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: {
          preview_url: false,
          body: message,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    return response.status === 200 || response.status === 201
  } catch (error) {
    console.error('WhatsApp send error:', error.response?.data || error.message)
    return false
  }
}



