import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { phoneNumber, message } = body

    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      )
    }

    // Check if WhatsApp is configured
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      return NextResponse.json(
        {
          error: 'WhatsApp not configured',
          message: 'Please configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your .env file',
        },
        { status: 400 }
      )
    }

    // Send WhatsApp message
    const sent = await sendWhatsAppMessage(phoneNumber, message)

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send WhatsApp message. Please check the phone number format and try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp message sent successfully',
    })
  } catch (error) {
    console.error('WhatsApp send error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}







