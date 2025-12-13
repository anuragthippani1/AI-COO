import { getChatCompletion } from '@/lib/openai'
import { getMemoryContext } from '@/lib/memory'
import { generateProposalPDF } from '@/lib/proposal'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval, createApprovalRequest } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { explainDecision } from './explainability_engine'

export async function generateProposal(userId, clientData, services, pricing) {
  try {
    // TODO: Add simulation mode check
    // TODO: Add rate limit check
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

    const proposalData = {
      clientName: clientData.name,
      clientEmail: clientData.email,
      proposalText: proposalText || '',
      services,
      pricing,
      generatedAt: new Date(),
    }

    // Evaluate confidence and risk
    const confidence = await evaluateConfidence(
      { clientData, services, pricing },
      proposalData
    )

    // Generate explanation
    const explanation = await explainDecision(
      {
        userId,
        actionType: 'generate_proposal',
        input: { clientData, services, pricing },
      },
      proposalData
    )

    // Check if approval is required
    const approvalCheck = await shouldRequireApproval(
      userId,
      'generate_proposal',
      confidence.confidenceScore,
      confidence.riskLevel
    )

    // Log activity
    const activityLog = await logActivity(
      userId,
      'generate_proposal',
      'proposal_agent',
      approvalCheck.requiresApproval ? 'pending' : 'completed',
      {
        confidenceScore: confidence.confidenceScore,
        riskLevel: confidence.riskLevel,
        explanation,
        inputData: { clientData, services, pricing },
        outputData: proposalData,
      }
    )

    // If approval required, create approval request
    if (approvalCheck.requiresApproval) {
      await createApprovalRequest(
        userId,
        'generate_proposal',
        proposalData,
        confidence,
        explanation
      )

      return {
        proposalText: proposalText || '',
        requiresApproval: true,
        approvalRequestId: activityLog?.id,
        confidence,
        explanation,
      }
    }

    // Generate PDF
    const pdfUrl = await generateProposalPDF(proposalData)

    return {
      proposalText: proposalText || '',
      pdfUrl,
      confidence,
      explanation,
    }
  } catch (error) {
    console.error('Error generating proposal:', error)
    throw error
  }
}

