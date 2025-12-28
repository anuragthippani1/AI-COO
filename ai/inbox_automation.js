/**
 * Autonomous Inbox Automation
 * Automatically processes emails and takes actions based on confidence
 * 
 * TODO: Future refactor - Use agent_manager.makeDecision() for centralized decision-making
 * This will ensure all AI actions go through the same confidence-based execution logic
 */

import { classifyEmail } from './email_classifier'
import { extractTasksFromEmail } from './task_extractor'
import { generateReply } from './reply_generator'
import { scheduleFollowUp } from './followup_scheduler'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval, createApprovalRequest } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { explainDecision } from './explainability_engine'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/gmail'
// TODO: Import simulation mode check when available
// import { isSimulationMode } from '@/ai/simulation_engine'
async function isSimulationMode(userId) {
  // TODO: Check user's simulation mode setting from database
  return false
}

/**
 * Process a new email autonomously
 * @param {string} userId - User ID
 * @param {object} email - Email object from database
 * @returns {Promise<object>} Processing result
 */
export async function processInboxEmail(userId, email) {
  try {
    // Check if already processed
    if (email.isProcessed) {
      return { success: true, alreadyProcessed: true }
    }

    const actions = []
    const results = {
      classification: null,
      tasks: [],
      reply: null,
      followUp: null,
      crmUpdate: null,
      executed: [],
      pendingApproval: [],
    }

    // Step 1: Classify email intent
    const classification = await classifyEmail(email.body, email.subject, email.from)
    results.classification = classification

    // Log classification
    await logActivity(userId, 'classify_email', 'inbox_automation', 'completed', {
      confidenceScore: Math.round(classification.confidence * 100),
      inputData: { emailId: email.id, subject: email.subject },
      outputData: classification,
      explanation: `Classified as ${classification.category} (${classification.urgency} urgency)`,
    })

    // Step 2: Extract tasks if needed
    if (classification.category === 'task' || classification.urgency === 'urgent' || classification.urgency === 'high') {
      const tasks = await extractTasksFromEmail(userId, email.body, {
        subject: email.subject,
        from: email.from,
        classification,
      })

      if (tasks && tasks.length > 0) {
        results.tasks = tasks

        // Auto-create tasks if confidence is high
        for (const task of tasks) {
          const taskConfidence = task.confidenceScore || 85
          const taskRisk = task.riskLevel || 'low'

          const approvalCheck = await shouldRequireApproval(
            userId,
            'create_task',
            taskConfidence,
            taskRisk
          )

          if (!approvalCheck.requiresApproval && taskConfidence >= 80) {
            // Auto-create task
            if (!(await isSimulationMode(userId))) {
              const createdTask = await prisma.task.create({
                data: {
                  userId,
                  title: task.title,
                  description: task.description || '',
                  priority: task.priority || 'MEDIUM',
                  dueDate: task.dueDate ? new Date(task.dueDate) : null,
                  source: 'email',
                  sourceId: email.id,
                  metadata: { classification, extractedFrom: email.id },
                },
              })

              results.executed.push({
                type: 'create_task',
                taskId: createdTask.id,
                title: task.title,
              })

              await logActivity(userId, 'create_task', 'inbox_automation', 'completed', {
                confidenceScore: taskConfidence,
                riskLevel: taskRisk,
                inputData: { emailId: email.id, task },
                outputData: { taskId: createdTask.id },
                explanation: `Auto-created task: ${task.title}`,
              })
            } else {
              results.executed.push({
                type: 'create_task',
                simulated: true,
                title: task.title,
              })
            }
          } else {
            // Request approval
            const explanation = await explainDecision('create_task', {
              email: { subject: email.subject, from: email.from },
              task,
            })

            const approvalRequest = await createApprovalRequest(
              userId,
              'create_task',
              { task, emailId: email.id },
              { confidenceScore: taskConfidence, riskLevel: taskRisk },
              explanation
            )

            results.pendingApproval.push({
              type: 'create_task',
              approvalRequestId: approvalRequest.approvalRequestId,
              task,
            })
          }
        }
      }
    }

    // Step 3: Generate reply if needed
    if (classification.needsReply && classification.category !== 'noise') {
      const replyResult = await generateReply(userId, email.body, {
        subject: email.subject,
        from: email.from,
        threadId: email.threadId,
        classification,
      })

      if (replyResult.reply) {
        results.reply = replyResult.reply
        const replyConfidence = replyResult.confidenceScore || 75
        const replyRisk = replyResult.riskLevel || 'medium'

        const approvalCheck = await shouldRequireApproval(
          userId,
          'send_email',
          replyConfidence,
          replyRisk
        )

        if (!approvalCheck.requiresApproval && replyConfidence >= 85) {
          // Auto-send reply
          if (!(await isSimulationMode(userId))) {
            try {
              await sendEmail(userId, {
                to: email.from,
                subject: `Re: ${email.subject}`,
                body: replyResult.reply,
                threadId: email.threadId,
              })

              results.executed.push({
                type: 'send_email',
                to: email.from,
                subject: email.subject,
              })

              await logActivity(userId, 'send_email', 'inbox_automation', 'completed', {
                confidenceScore: replyConfidence,
                riskLevel: replyRisk,
                inputData: { emailId: email.id, to: email.from },
                outputData: { sent: true },
                explanation: `Auto-replied to ${email.from}`,
              })

              // Update email status
              await prisma.email.update({
                where: { id: email.id },
                data: { status: 'REPLIED', aiReply: replyResult.reply },
              })
            } catch (error) {
              console.error('Error auto-sending reply:', error)
              results.executed.push({
                type: 'send_email',
                error: error.message,
              })
            }
          } else {
            results.executed.push({
              type: 'send_email',
              simulated: true,
              to: email.from,
            })
          }
        } else {
          // Request approval
          const explanation = await explainDecision('send_email', {
            email: { subject: email.subject, from: email.from },
            reply: replyResult.reply,
          })

          const approvalRequest = await createApprovalRequest(
            userId,
            'send_email',
            { reply: replyResult.reply, emailId: email.id, to: email.from },
            { confidenceScore: replyConfidence, riskLevel: replyRisk },
            explanation
          )

          results.pendingApproval.push({
            type: 'send_email',
            approvalRequestId: approvalRequest.approvalRequestId,
            reply: replyResult.reply,
          })
        }
      }
    }

    // Step 4: Schedule follow-up if needed
    if (classification.needsFollowUp || classification.category === 'lead') {
      const followUpResult = await scheduleFollowUp(
        userId,
        email.from,
        email.body,
        {
          subject: email.subject,
          classification,
          emailId: email.id,
        }
      )

      if (followUpResult.followUp) {
        results.followUp = followUpResult.followUp
        const followUpConfidence = followUpResult.confidenceScore || 80
        const followUpRisk = followUpResult.riskLevel || 'low'

        const approvalCheck = await shouldRequireApproval(
          userId,
          'create_followup',
          followUpConfidence,
          followUpRisk
        )

        if (!approvalCheck.requiresApproval && followUpConfidence >= 75) {
          // Auto-schedule follow-up
          if (!(await isSimulationMode(userId))) {
            const createdFollowUp = await prisma.followUp.create({
              data: {
                userId,
                leadName: email.from.split('@')[0] || email.from,
                leadPhone: '',
                leadEmail: email.from,
                message: followUpResult.followUp.message || 'Follow-up message',
                scheduledFor: new Date(followUpResult.followUp.scheduledFor || Date.now() + 24 * 60 * 60 * 1000),
                channel: 'email',
                metadata: { emailId: email.id, classification },
              },
            })

            results.executed.push({
              type: 'schedule_followup',
              followUpId: createdFollowUp.id,
              scheduledFor: createdFollowUp.scheduledFor,
            })

            await logActivity(userId, 'schedule_followup', 'inbox_automation', 'completed', {
              confidenceScore: followUpConfidence,
              riskLevel: followUpRisk,
              inputData: { emailId: email.id },
              outputData: { followUpId: createdFollowUp.id },
              explanation: `Auto-scheduled follow-up for ${email.from}`,
            })
          } else {
            results.executed.push({
              type: 'schedule_followup',
              simulated: true,
            })
          }
        } else {
          // Request approval
          const explanation = await explainDecision('schedule_followup', {
            email: { subject: email.subject, from: email.from },
          })

          const approvalRequest = await createApprovalRequest(
            userId,
            'schedule_followup',
            { followUp: followUpResult.followUp, emailId: email.id },
            { confidenceScore: followUpConfidence, riskLevel: followUpRisk },
            explanation
          )

          results.pendingApproval.push({
            type: 'schedule_followup',
            approvalRequestId: approvalRequest.approvalRequestId,
            followUp: followUpResult.followUp,
          })
        }
      }
    }

    // Step 5: Update CRM if lead
    if (classification.category === 'lead') {
      // TODO: Update CRM lead status
      // This would create/update a lead in the CRM system
      results.crmUpdate = {
        type: 'lead_detected',
        email: email.from,
        status: 'new',
      }

      await logActivity(userId, 'update_crm', 'inbox_automation', 'completed', {
        confidenceScore: Math.round(classification.confidence * 100),
        inputData: { emailId: email.id, from: email.from },
        outputData: results.crmUpdate,
        explanation: `Detected lead: ${email.from}`,
      })
    }

    // Mark email as processed
    await prisma.email.update({
      where: { id: email.id },
      data: {
        isProcessed: true,
        extractedTasks: results.tasks,
        aiReply: results.reply,
        metadata: {
          ...(email.metadata || {}),
          classification,
          processedAt: new Date().toISOString(),
          actions: results.executed,
          pendingApprovals: results.pendingApproval,
        },
      },
    })

    return {
      success: true,
      emailId: email.id,
      results,
    }
  } catch (error) {
    console.error('[InboxAutomation] Error processing email:', error)
    await logActivity(userId, 'process_email', 'inbox_automation', 'failed', {
      inputData: { emailId: email.id },
      outputData: { error: error.message },
    })
    return {
      success: false,
      error: error.message,
    }
  }
}

