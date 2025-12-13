import { getChatCompletion } from '@/lib/openai'
import { getMemoryContext } from '@/lib/memory'
import { generateProposalPDF } from '@/lib/proposal'

export async function generateProposal(userId, clientData, services, pricing) {
  try {
    // Get business context from memory
    const businessContext = await getMemoryContext(userId, 'business services pricing', 1000)
    const writingStyle = await getMemoryContext(userId, 'proposal writing style tone', 500)

    const prompt = `Generate a professional business proposal.

Client: ${clientData.name}
Email: ${clientData.email || 'N/A'}

Services:
${services.map((s, i) => `${i + 1}. ${s.name}: ${s.description}`).join('\n')}

Pricing:
${pricing.map((p, i) => `${i + 1}. ${p.item}: $${p.price}`).join('\n')}

${businessContext ? `Business Context:\n${businessContext}` : ''}
${writingStyle ? `Writing Style:\n${writingStyle}` : ''}

Generate a professional proposal with:
1. Executive Summary
2. Understanding of Client Needs
3. Proposed Solution/Services
4. Pricing Breakdown
5. Timeline
6. Terms & Conditions
7. Next Steps

Return the proposal as formatted text ready for PDF conversion.`

    const proposalText = await getChatCompletion([
      {
        role: 'system',
        content: 'You are a professional proposal writer. Create compelling, professional business proposals.',
      },
      { role: 'user', content: prompt },
    ])

    // Generate PDF
    const pdfUrl = await generateProposalPDF({
      clientName: clientData.name,
      clientEmail: clientData.email,
      proposalText: proposalText || '',
      services,
      pricing,
      generatedAt: new Date(),
    })

    return {
      proposalText: proposalText || '',
      pdfUrl,
    }
  } catch (error) {
    console.error('Error generating proposal:', error)
    throw error
  }
}

