import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'
import { saveMemory } from '@/lib/memory'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval, createApprovalRequest } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { explainDecision } from './explainability_engine'

export async function scheduleFollowUp(userId, contactInfo, context) {
  try {
    // TODO: Add simulation mode check
    // TODO: Add rate limit check
    const prompt = `Based on this conversation context, determine if a follow-up is needed and when.

Context:
${context}

Contact: ${contactInfo}

If a follow-up is needed, return JSON with:
{
  "needed": true,
  "leadName": "Contact name",
  "leadPhone": "Phone if available",
  "leadEmail": "Email if available",
  "message": "Follow-up message draft",
  "scheduledFor": "ISO date string",
  "channel": "whatsapp" | "email" | "sms"
}

If no follow-up needed, return: {"needed": false}`

    const response = await getChatCompletion([
      {
        role: 'system',
        content: 'You are a follow-up scheduling assistant. Determine when and how to follow up with leads.',
      },
      { role: 'user', content: prompt },
    ])

    const jsonMatch = response?.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return null
    }

    const decision = JSON.parse(jsonMatch[0])
    if (!decision.needed) {
      return null
    }

    const followUp = {
      leadName: decision.leadName,
      leadPhone: decision.leadPhone,
      leadEmail: decision.leadEmail,
      message: decision.message,
      scheduledFor: new Date(decision.scheduledFor),
      channel: decision.channel || 'whatsapp',
    }

    // Evaluate confidence and risk
    const confidence = await evaluateConfidence(
      { contactInfo, context },
      followUp
    )

    // Generate explanation
    const explanation = await explainDecision(
      {
        userId,
        actionType: 'schedule_followup',
        input: { contactInfo, context },
      },
      followUp
    )

    // Check if approval is required
    const approvalCheck = await shouldRequireApproval(
      userId,
      'schedule_followup',
      confidence.confidenceScore,
      confidence.riskLevel
    )

    // Log activity
    const activityLog = await logActivity(
      userId,
      'schedule_followup',
      'followup_agent',
      approvalCheck.requiresApproval ? 'pending' : 'completed',
      {
        confidenceScore: confidence.confidenceScore,
        riskLevel: confidence.riskLevel,
        explanation,
        inputData: { contactInfo, context },
        outputData: followUp,
      }
    )

    // If approval required, create approval request
    if (approvalCheck.requiresApproval) {
      await createApprovalRequest(
        userId,
        'schedule_followup',
        followUp,
        confidence,
        explanation
      )

      // Save as pending (not scheduled yet)
      return {
        ...followUp,
        requiresApproval: true,
        approvalRequestId: activityLog?.id,
        confidence,
        explanation,
      }
    }

    // Save to database
    const savedFollowUp = await prisma.followUp.create({
      data: {
        userId,
        leadName: followUp.leadName,
        leadPhone: followUp.leadPhone || '',
        leadEmail: followUp.leadEmail,
        message: followUp.message,
        scheduledFor: followUp.scheduledFor,
        channel: followUp.channel,
        status: 'pending',
        metadata: {
          confidenceScore: confidence.confidenceScore,
          riskLevel: confidence.riskLevel,
        },
      },
    })

    // Save to memory
    await saveMemory(userId, `Follow-up scheduled: ${followUp.leadName} - ${followUp.message}`, {
      type: 'followup',
      scheduledFor: followUp.scheduledFor.toISOString(),
      channel: followUp.channel,
    })

    return {
      ...savedFollowUp,
      confidence,
      explanation,
    }
  } catch (error) {
    console.error('Error scheduling follow-up:', error)
    return null
  }
}

