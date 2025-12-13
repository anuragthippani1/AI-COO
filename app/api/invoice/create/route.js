import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateInvoicePDF } from '@/lib/invoice'
import { sendEmail } from '@/lib/gmail'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { clientName, clientEmail, items, tax = 0, dueDate } = body

    if (!clientName || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity)
    }, 0)
    const total = subtotal + tax

    // Generate invoice number
    const invoiceCount = await prisma.invoice.count({
      where: { userId },
    })
    const invoiceNumber = `INV-${Date.now()}-${invoiceCount + 1}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        invoiceNumber,
        clientName,
        clientEmail,
        items: items,
        subtotal,
        tax,
        total,
        status: 'draft',
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    })

    // Generate PDF
    const pdfUrl = await generateInvoicePDF(invoice)

    // Update invoice with PDF URL
    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoice.id },
      data: { pdfUrl },
    })

    // Auto-send email if client email provided and autoSend is true
    if (body.autoSend && clientEmail) {
      try {
        const invoiceUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${pdfUrl}`
        await sendEmail(
          userId,
          clientEmail,
          `Invoice ${invoiceNumber} from AI COO`,
          `Dear ${clientName},\n\nPlease find attached invoice ${invoiceNumber}.\n\nTotal: $${total.toFixed(2)}\nDue Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}\n\nView invoice: ${invoiceUrl}\n\nThank you!`,
          `<p>Dear ${clientName},</p><p>Please find attached invoice <strong>${invoiceNumber}</strong>.</p><p><strong>Total:</strong> $${total.toFixed(2)}<br><strong>Due Date:</strong> ${dueDate ? new Date(dueDate).toLocaleDateString() : 'N/A'}</p><p><a href="${invoiceUrl}">View Invoice</a></p><p>Thank you!</p>`
        )
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { status: 'sent' },
        })
      } catch (error) {
        console.error('Error auto-sending invoice email:', error)
        // Don't fail the request if email send fails
      }
    }

    return NextResponse.json({
      success: true,
      invoice: updatedInvoice,
    })
  } catch (error) {
    console.error('Invoice creation error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

