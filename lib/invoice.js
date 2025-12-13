import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export async function generateInvoicePDF(invoice) {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'invoices')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const filename = `invoice-${invoice.invoiceNumber}.pdf`
      const filepath = path.join(uploadsDir, filename)

      const doc = new PDFDocument({ margin: 50 })

      // Pipe to file
      const stream = fs.createWriteStream(filepath)
      doc.pipe(stream)

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'right' })
      doc.fontSize(10).text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'right' })
      doc.moveDown()

      // Client info
      doc.fontSize(14).text('Bill To:', { continued: false })
      doc.fontSize(12).text(invoice.clientName)
      if (invoice.clientEmail) {
        doc.fontSize(10).text(invoice.clientEmail)
      }
      doc.moveDown()

      // Date
      doc.fontSize(10).text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, {
        align: 'right',
      })
      if (invoice.dueDate) {
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, {
          align: 'right',
        })
      }
      doc.moveDown(2)

      // Items table
      doc.fontSize(12).text('Items', { underline: true })
      doc.moveDown(0.5)

      const items = invoice.items

      // Table header
      doc.fontSize(10)
      doc.text('Description', 50, doc.y)
      doc.text('Qty', 300, doc.y)
      doc.text('Price', 350, doc.y, { align: 'right' })
      doc.text('Total', 450, doc.y, { align: 'right' })
      doc.moveDown(0.5)
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(0.5)

      // Table rows
      items.forEach((item) => {
        doc.text(item.name, 50, doc.y)
        doc.text(item.quantity.toString(), 300, doc.y)
        doc.text(`$${item.price.toFixed(2)}`, 350, doc.y, { align: 'right' })
        doc.text(`$${item.total.toFixed(2)}`, 450, doc.y, { align: 'right' })
        doc.moveDown(0.5)
      })

      doc.moveDown(1)

      // Totals
      doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(0.5)
      doc.text('Subtotal:', 350, doc.y, { align: 'right' })
      doc.text(`$${invoice.subtotal.toFixed(2)}`, 450, doc.y, { align: 'right' })
      doc.moveDown(0.5)

      if (invoice.tax > 0) {
        doc.text('Tax:', 350, doc.y, { align: 'right' })
        doc.text(`$${invoice.tax.toFixed(2)}`, 450, doc.y, { align: 'right' })
        doc.moveDown(0.5)
      }

      doc.fontSize(14).font('Helvetica-Bold')
      doc.moveTo(350, doc.y).lineTo(550, doc.y).stroke()
      doc.moveDown(0.5)
      doc.text('Total:', 350, doc.y, { align: 'right' })
      doc.text(`$${invoice.total.toFixed(2)}`, 450, doc.y, { align: 'right' })

      // Footer
      doc.fontSize(8)
        .font('Helvetica')
        .text('Thank you for your business!', 50, doc.page.height - 100, {
          align: 'center',
        })

      doc.end()

      stream.on('finish', () => {
        const publicUrl = `/invoices/${filename}`
        resolve(publicUrl)
      })

      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })
}



