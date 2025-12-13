import PDFDocument from 'pdfkit'
import fs from 'fs'
import path from 'path'

export async function generateProposalPDF(proposalData) {
  return new Promise((resolve, reject) => {
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'proposals')
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true })
      }

      const filename = `proposal-${Date.now()}.pdf`
      const filepath = path.join(uploadsDir, filename)

      const doc = new PDFDocument({ margin: 50 })

      const stream = fs.createWriteStream(filepath)
      doc.pipe(stream)

      // Header
      doc.fontSize(20).text('BUSINESS PROPOSAL', { align: 'center' })
      doc.moveDown()

      // Client Info
      doc.fontSize(14).text('Prepared for:', { continued: false })
      doc.fontSize(12).text(proposalData.clientName)
      if (proposalData.clientEmail) {
        doc.fontSize(10).text(proposalData.clientEmail)
      }
      doc.moveDown()

      doc.fontSize(10).text(
        `Date: ${new Date(proposalData.generatedAt).toLocaleDateString()}`,
        { align: 'right' }
      )
      doc.moveDown(2)

      // Proposal Content
      doc.fontSize(12)
      const lines = proposalData.proposalText.split('\n')
      lines.forEach((line) => {
        if (line.trim().startsWith('#') || line.trim().match(/^[A-Z\s]+$/)) {
          doc.fontSize(14).font('Helvetica-Bold').text(line.trim(), { underline: true })
        } else {
          doc.fontSize(11).font('Helvetica').text(line.trim())
        }
        doc.moveDown(0.5)
      })

      // Services & Pricing
      if (proposalData.services && proposalData.services.length > 0) {
        doc.moveDown()
        doc.fontSize(14).font('Helvetica-Bold').text('Services & Pricing', { underline: true })
        doc.moveDown(0.5)

        proposalData.services.forEach((service, index) => {
          doc.fontSize(11)
          doc.text(`${index + 1}. ${service.name}`, { continued: true })
          if (proposalData.pricing && proposalData.pricing[index]) {
            doc.text(` - $${proposalData.pricing[index].price}`, { align: 'right' })
          }
          doc.moveDown(0.3)
        })
      }

      // Footer
      doc.fontSize(8)
        .font('Helvetica')
        .text('Thank you for considering our proposal!', 50, doc.page.height - 100, {
          align: 'center',
        })

      doc.end()

      stream.on('finish', () => {
        const publicUrl = `/proposals/${filename}`
        resolve(publicUrl)
      })

      stream.on('error', reject)
    } catch (error) {
      reject(error)
    }
  })
}

