import { evaluateConfidence } from './confidence_engine'
import { explainDecision } from './explainability_engine'

/**
 * AI Action Preview Mode
 * Generates preview of what AI will do before execution
 */

/**
 * Generate preview for an AI action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @param {object} input - Input context
 * @param {object} proposedAction - Proposed action data
 * @returns {Promise<{preview: object, confidence: object, explanation: string}>}
 */
export async function generatePreview(userId, actionType, input, proposedAction) {
  try {
    // Evaluate confidence
    const confidence = await evaluateConfidence(input, proposedAction)

    // Generate explanation
    const explanation = await explainDecision(
      {
        userId,
        actionType,
        input,
        proposedAction,
      },
      proposedAction
    )

    // Generate preview text
    const preview = {
      actionType,
      whatWillHappen: generateWhatWillHappen(actionType, proposedAction),
      whyDecided: explanation,
      confidenceScore: confidence.confidenceScore,
      riskLevel: confidence.riskLevel,
      factors: confidence.factors,
      proposedAction,
      timestamp: new Date().toISOString(),
    }

    return {
      preview,
      confidence,
      explanation,
    }
  } catch (error) {
    console.error('[PreviewEngine] Error generating preview:', error)
    return {
      preview: {
        actionType,
        whatWillHappen: 'Error generating preview',
        whyDecided: 'Unable to generate explanation',
        confidenceScore: 0,
        riskLevel: 'high',
        proposedAction,
      },
      confidence: {
        confidenceScore: 0,
        riskLevel: 'high',
        factors: { error: error.message },
      },
      explanation: 'Error generating preview',
    }
  }
}

/**
 * Generate "what will happen" description
 */
function generateWhatWillHappen(actionType, proposedAction) {
  const descriptions = {
    send_email: `Send an email to ${proposedAction.to || 'recipient'} with subject: "${proposedAction.subject || 'No subject'}"`,
    send_invoice: `Send invoice ${proposedAction.invoiceNumber || 'N/A'} to ${proposedAction.clientEmail || 'client'}`,
    create_task: `Create task: "${proposedAction.title || 'Untitled'}" with priority ${proposedAction.priority || 'MEDIUM'}`,
    move_lead: `Move lead "${proposedAction.leadName || 'Lead'}" from ${proposedAction.fromStage || 'current'} to ${proposedAction.toStage || 'target'} stage`,
    send_whatsapp: `Send WhatsApp message to ${proposedAction.phoneNumber || 'recipient'}`,
    schedule_meeting: `Schedule meeting "${proposedAction.title || 'Meeting'}" on ${proposedAction.date || 'date TBD'}`,
    generate_proposal: `Generate proposal for ${proposedAction.clientName || 'client'}`,
    update_crm: `Update CRM record for ${proposedAction.contactName || 'contact'}`,
  }

  return descriptions[actionType] || `Execute action: ${actionType}`
}

/**
 * Format preview for UI display
 * @param {object} previewData - Preview data from generatePreview
 * @returns {object} Formatted preview for UI
 */
export function formatPreviewForUI(previewData) {
  return {
    title: `Preview: ${previewData.preview.actionType}`,
    description: previewData.preview.whatWillHappen,
    explanation: previewData.explanation,
    confidence: {
      score: previewData.preview.confidenceScore,
      level: getConfidenceLevel(previewData.preview.confidenceScore),
      risk: previewData.preview.riskLevel,
    },
    factors: previewData.preview.factors,
    action: previewData.preview.proposedAction,
    timestamp: previewData.preview.timestamp,
  }
}

function getConfidenceLevel(score) {
  if (score >= 80) return 'high'
  if (score >= 60) return 'medium'
  if (score >= 40) return 'low'
  return 'very_low'
}






