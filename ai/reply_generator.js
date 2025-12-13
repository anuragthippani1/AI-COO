import { getChatCompletion } from '@/lib/openai'
import { getMemoryContext } from '@/lib/memory'
import { getWritingTone } from '@/lib/memory_enhanced'
import { getUserStyleProfile } from '@/ai/user_style_learner'
import { prisma } from '@/lib/prisma'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval, createApprovalRequest } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { explainDecision } from './explainability_engine'

export async function generateReply(userId, emailContent, metadata = {}) {
  try {
    // TODO: Add simulation mode check
    // TODO: Add rate limit check
    // Get user's style profile (learned from past emails)
    const styleProfile = await getUserStyleProfile(userId)
    
    // Get user's writing style from memory (enhanced) - fallback
    const writingTone = await getWritingTone(userId)
    const writingStyle = writingTone || await getMemoryContext(userId, 'email writing style tone', 500)
    
    // Get relevant context
    const context = await getMemoryContext(userId, emailContent, 1500)

    // Build style instructions from profile
    const styleInstructions = buildStyleInstructions(styleProfile)

    const prompt = `Generate an email reply based on this email. IMPORTANT: Match the user's exact writing style.

Original email:
${emailContent}

${context ? `Relevant context:\n${context}` : ''}

${styleInstructions}

${writingStyle ? `Additional writing style notes:\n${writingStyle}` : ''}

Generate a reply that:
1. Acknowledges the email
2. Addresses key points
3. Includes a clear call to action if needed
4. EXACTLY matches the user's writing style (greeting, tone, vocabulary, closing)
5. Uses the same formality level and language style

Return only the email body, no subject line.`

    const reply = await getChatCompletion([
      {
        role: 'system',
        content: `You are an email reply assistant. Generate email replies that EXACTLY match the user's personal writing style. Use their preferred greeting, tone, vocabulary, and closing style.`,
      },
      { role: 'user', content: prompt },
    ], 0.7)

    // Evaluate confidence and risk
    const confidence = await evaluateConfidence(
      { emailContent, ...metadata },
      reply
    )

    // Generate explanation
    const explanation = await explainDecision(
      {
        userId,
        actionType: 'send_email',
        input: { emailContent, ...metadata },
      },
      { reply }
    )

    // Check if approval is required
    const approvalCheck = await shouldRequireApproval(
      userId,
      'send_email',
      confidence.confidenceScore,
      confidence.riskLevel
    )

    // Log activity
    const activityLog = await logActivity(
      userId,
      'generate_reply',
      'reply_agent',
      approvalCheck.requiresApproval ? 'pending' : 'completed',
      {
        confidenceScore: confidence.confidenceScore,
        riskLevel: confidence.riskLevel,
        explanation,
        inputData: { emailContent, ...metadata },
        outputData: { reply },
      }
    )

    // If approval required, create approval request
    if (approvalCheck.requiresApproval) {
      await createApprovalRequest(
        userId,
        'send_email',
        {
          to: metadata.to || metadata.from,
          subject: metadata.subject || 'Re: ' + (metadata.emailSubject || ''),
          body: reply,
        },
        confidence,
        explanation
      )

      // Save reply to email record as draft
      if (metadata.messageId) {
        await prisma.email.updateMany({
          where: {
            userId,
            messageId: metadata.messageId,
          },
          data: {
            aiReply: reply || '',
            metadata: {
              ...metadata,
              requiresApproval: true,
              confidenceScore: confidence.confidenceScore,
              riskLevel: confidence.riskLevel,
            },
          },
        })
      }

      return {
        reply: reply || '',
        requiresApproval: true,
        approvalRequestId: activityLog?.id,
        confidence,
        explanation,
      }
    }

    // Save reply to email record if messageId exists
    if (metadata.messageId) {
      await prisma.email.updateMany({
        where: {
          userId,
          messageId: metadata.messageId,
        },
        data: {
          aiReply: reply || '',
          metadata: {
            ...metadata,
            confidenceScore: confidence.confidenceScore,
            riskLevel: confidence.riskLevel,
          },
        },
      })
    }

    return {
      reply: reply || '',
      confidence,
      explanation,
    }
  } catch (error) {
    console.error('Error generating reply:', error)
    return 'I apologize, but I encountered an error generating a reply. Please try again.'
  }
}

/**
 * Build style instructions from style profile
 */
function buildStyleInstructions(styleProfile) {
  if (!styleProfile || styleProfile.stats?.sampleCount === 0) {
    return 'Use a professional and friendly writing style.'
  }

  const instructions = []

  instructions.push(`Writing Style Profile:`)
  instructions.push(`- Greeting style: ${styleProfile.greeting || 'Hi'}`)
  instructions.push(`- Closing style: ${styleProfile.closing || 'Thanks'}`)
  instructions.push(`- Formality: ${styleProfile.formality || 'professional'}`)
  instructions.push(`- Tone: ${styleProfile.tone || 'professional and friendly'}`)
  instructions.push(`- Sentence length: ${styleProfile.sentenceLength || 'medium'}`)
  instructions.push(`- Language style: ${styleProfile.languageStyle || 'direct'}`)
  instructions.push(`- Message length: ${styleProfile.messageLength || 'medium'}`)
  
  if (styleProfile.emojiUsage && styleProfile.emojiUsage !== 'never') {
    instructions.push(`- Emoji usage: ${styleProfile.emojiUsage}`)
  }
  
  if (styleProfile.vocabulary && styleProfile.vocabulary.length > 0) {
    instructions.push(`- Preferred phrases/vocabulary: ${styleProfile.vocabulary.join(', ')}`)
  }

  instructions.push(`\nIMPORTANT: Start with "${styleProfile.greeting || 'Hi'}" and end with "${styleProfile.closing || 'Thanks'}". Match the tone, formality, and vocabulary exactly.`)

  return instructions.join('\n')
}

