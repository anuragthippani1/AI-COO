import { getChatCompletion } from '@/lib/openai'
import { saveMemory, getMemoryContext, searchMemory } from '@/lib/memory'
import { prisma } from '@/lib/prisma'
import { extractTasksFromEmail } from './task_extractor'
import { generateReply } from './reply_generator'
import { scheduleFollowUp } from './followup_scheduler'
import { analyzeEmailThread } from './email_thread_analyzer'
import { computePriority } from './priority_engine'
import { evaluateConfidence } from './confidence_engine'
import { shouldRequireApproval, createApprovalRequest } from '@/lib/approval_manager'
import { logActivity } from '@/lib/activity_logger'
import { explainDecision } from './explainability_engine'

/**
 * Main agent runner - processes input and determines actions
 * CENTRALIZED DECISION HUB: All AI actions flow through here for confidence-based execution
 * 
 * NOTE: In the agent-driven architecture, this is primarily used for:
 * - User queries/commands
 * - Workflow-triggered actions
 * - Manual overrides
 * 
 * For event-driven actions (emails, tasks, follow-ups), use:
 * - eventSystem.emit() to trigger events
 * - agent_loop.js handles events automatically
 * - makeDecision() centralizes all action decisions
 */
export async function runAgent(input) {
  try {
    // Get relevant memory context
    const memoryContext = await getMemoryContext(input.userId, input.content)

    // Build system prompt with memory context
    const systemPrompt = `You are an AI COO assistant helping manage business operations.
You have access to the user's memory and context:
${memoryContext}

Your capabilities:
1. Extract tasks from emails and messages
2. Generate email replies
3. Schedule follow-ups
4. Create workflows
5. Answer questions using memory

Be concise, actionable, and professional.`

    const userPrompt = `User request (type: ${input.type}):
${input.content}

${input.metadata ? `Metadata: ${JSON.stringify(input.metadata)}` : ''}

What should I do?`

    // Get AI decision
    const decision = await getChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ])

    // Save interaction to memory
    await saveMemory(input.userId, `User: ${input.content}\nAI: ${decision}`, {
      type: 'conversation',
      source: 'agent',
    })

    // Route to appropriate handler
    switch (input.type) {
      case 'email':
        return await handleEmail(input)
      case 'task':
        return await handleTask(input)
      case 'query':
        return await handleQuery(input, decision)
      case 'workflow':
        return await handleWorkflow(input)
      default:
        return {
          success: false,
          error: 'Unknown input type',
        }
    }
  } catch (error) {
    console.error('Agent error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Execute an action after decision is made
 * This is the ONLY way actions should be executed in the agent-driven system
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action
 * @param {object} actionData - Action data
 * @returns {Promise<{success: boolean, result?: object, error?: string}>}
 */
export async function executeAction(userId, actionType, actionData) {
  try {
    switch (actionType) {
      case 'create_task':
        return await executeCreateTask(userId, actionData)
      
      case 'send_email':
        return await executeSendEmail(userId, actionData)
      
      case 'schedule_followup':
        return await executeScheduleFollowUp(userId, actionData)
      
      case 'update_crm':
        return await executeUpdateCRM(userId, actionData)
      
      case 'notify_task_overdue':
        return await executeNotifyTaskOverdue(userId, actionData)
      
      case 'create_invoice':
        return await executeCreateInvoice(userId, actionData)
      
      case 'send_whatsapp':
        return await executeSendWhatsApp(userId, actionData)
      
      case 'send_followup':
        return await executeSendFollowUp(userId, actionData)
      
      case 'notify_task_due_soon':
        return await executeNotifyTaskDueSoon(userId, actionData)
      
      case 'send_calendar_reminder':
        return await executeSendCalendarReminder(userId, actionData)
      
      case 'send_invoice_reminder':
        return await executeSendInvoiceReminder(userId, actionData)
      
      default:
        return {
          success: false,
          error: `Unknown action type: ${actionType}`,
        }
    }
  } catch (error) {
    console.error(`[AgentManager] Error executing ${actionType}:`, error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Centralized decision maker for AI actions
 * Determines: auto-execute, request approval, or escalate
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (create_task, send_email, etc.)
 * @param {object} actionData - Data for the action
 * @param {object} context - Additional context (email, task, etc.)
 * @returns {Promise<{decision: string, executed?: boolean, approvalRequestId?: string, explanation?: string, result?: object}>}
 */
export async function makeDecision(userId, actionType, actionData, context = {}) {
  try {
    // Evaluate confidence and risk
    const confidenceResult = await evaluateConfidence(context, actionData)
    const { confidenceScore, riskLevel } = confidenceResult

    // Check if approval is required
    const approvalCheck = await shouldRequireApproval(
      userId,
      actionType,
      confidenceScore,
      riskLevel
    )

    // Generate explanation for the action
    const explanation = await explainDecision(actionType, {
      ...context,
      actionData,
      confidenceScore,
      riskLevel,
    })

    // Decision logic: auto-execute if high confidence and low risk
    if (!approvalCheck.requiresApproval && confidenceScore >= 80 && riskLevel === 'low') {
      // Auto-execute
      const executionResult = await executeAction(userId, actionType, actionData)
      
      await logActivity(userId, actionType, 'agent_manager', executionResult.success ? 'completed' : 'failed', {
        confidenceScore,
        riskLevel,
        inputData: context,
        outputData: executionResult.result || actionData,
        explanation: `${explanation} (Auto-executed)`,
      })

      return {
        decision: 'auto_execute',
        executed: true,
        success: executionResult.success,
        result: executionResult.result,
        confidenceScore,
        riskLevel,
        explanation,
      }
    } else if (confidenceScore >= 70 && riskLevel !== 'high') {
      // Request approval but suggest auto-execution
      const approvalRequest = await createApprovalRequest(
        userId,
        actionType,
        actionData,
        { confidenceScore, riskLevel },
        explanation
      )

      await logActivity(userId, actionType, 'agent_manager', 'pending_approval', {
        confidenceScore,
        riskLevel,
        inputData: context,
        outputData: actionData,
        explanation: `${explanation} (Pending approval)`,
      })

      return {
        decision: 'request_approval',
        executed: false,
        approvalRequestId: approvalRequest.approvalRequestId,
        confidenceScore,
        riskLevel,
        explanation,
      }
    } else {
      // Low confidence or high risk - require approval
      const approvalRequest = await createApprovalRequest(
        userId,
        actionType,
        actionData,
        { confidenceScore, riskLevel },
        explanation
      )

      await logActivity(userId, actionType, 'agent_manager', 'requires_approval', {
        confidenceScore,
        riskLevel,
        inputData: context,
        outputData: actionData,
        explanation: `${explanation} (Requires approval - low confidence or high risk)`,
      })

      return {
        decision: 'require_approval',
        executed: false,
        approvalRequestId: approvalRequest.approvalRequestId,
        confidenceScore,
        riskLevel,
        explanation,
      }
    }
  } catch (error) {
    console.error('[AgentManager] Error making decision:', error)
    // On error, require approval for safety
    return {
      decision: 'require_approval',
      executed: false,
      confidenceScore: 0,
      riskLevel: 'high',
      explanation: 'Error evaluating action - approval required',
      error: error.message,
    }
  }
}

async function handleEmail(input) {
  const emailContent = input.content
  const emailMetadata = input.metadata || {}

  // Analyze email thread if threadId available
  let threadInsights = null
  if (emailMetadata.threadId) {
    try {
      const threadAnalysis = await analyzeEmailThread(input.userId, emailMetadata.threadId)
      if (threadAnalysis.success) {
        threadInsights = threadAnalysis.insights
      }
    } catch (error) {
      console.warn('Thread analysis failed:', error)
    }
  }

  // Compute priority using priority engine
  const priorityResult = await computePriority(input.userId, {
    type: 'email',
    body: emailContent,
    subject: emailMetadata.subject,
    from: emailMetadata.from,
    threadId: emailMetadata.threadId,
  })

  // Extract tasks (with priority and thread insights)
  const tasks = await extractTasksFromEmail(input.userId, emailContent, {
    ...emailMetadata,
    priority: priorityResult.priority,
    threadInsights,
  })

  // Generate reply (with thread context)
  const reply = await generateReply(input.userId, emailContent, {
    ...emailMetadata,
    threadInsights,
  })

  // Check if follow-up is needed (with priority)
  let followUpAction = null
  if (emailMetadata.needsFollowUp || threadInsights?.followUpNeeds?.length > 0) {
    followUpAction = await scheduleFollowUp(
      input.userId,
      emailMetadata.from || '',
      emailContent,
      {
        ...emailMetadata,
        priority: priorityResult.priority,
        threadInsights,
      }
    )
  }

  // TODO: Use centralized makeDecision() for each action (create_task, send_email, schedule_followup)
  // For now, returning suggestions - inbox_automation.js handles the actual execution with confidence-based logic
  // Future: Refactor inbox_automation to use agent_manager.makeDecision() for consistency

  return {
    success: true,
    data: {
      tasks,
      reply,
      followUp: followUpAction,
      priority: priorityResult.priority,
      threadInsights,
    },
    actions: [
      ...tasks.map((task) => ({
        type: 'create_task',
        payload: task,
      })),
      {
        type: 'suggest_reply',
        payload: reply,
      },
    ],
  }
}

async function handleTask(input) {
  // Parse task creation request
  const taskData = JSON.parse(input.content)
  
  const task = await prisma.task.create({
    data: {
      userId: input.userId,
      title: taskData.title,
      description: taskData.description,
      priority: taskData.priority || 'MEDIUM',
      dueDate: taskData.dueDate ? new Date(taskData.dueDate) : null,
      source: 'ai_generated',
      metadata: taskData.metadata || {},
    },
  })

  // Save to memory
  await saveMemory(input.userId, `Task created: ${task.title}`, {
    type: 'task',
    source: 'agent',
  })

  return {
    success: true,
    data: task,
  }
}

async function handleQuery(input, aiDecision) {
  // Search memory for relevant information
  const relevantMemories = await searchMemory(input.userId, input.content, 5)

  return {
    success: true,
    data: {
      answer: aiDecision,
      relevantMemories,
    },
  }
}

async function handleWorkflow(input) {
  const workflowData = JSON.parse(input.content)

  const workflow = await prisma.workflow.create({
    data: {
      userId: input.userId,
      name: workflowData.name,
      description: workflowData.description,
      trigger: workflowData.trigger,
      actions: workflowData.actions,
      isActive: true,
      metadata: workflowData.metadata || {},
    },
  })

  return {
    success: true,
    data: workflow,
  }
}

// Execution functions for each action type

async function executeCreateTask(userId, actionData) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: actionData.title || actionData.task?.title,
      description: actionData.description || actionData.task?.description || '',
      priority: actionData.priority || actionData.task?.priority || 'MEDIUM',
      dueDate: actionData.dueDate || actionData.task?.dueDate ? new Date(actionData.dueDate || actionData.task.dueDate) : null,
      source: 'ai_generated',
      sourceId: actionData.emailId || null,
      metadata: actionData.metadata || {},
    },
  })

  await saveMemory(userId, `Task created: ${task.title}`, {
    type: 'task',
    source: 'agent',
    taskId: task.id,
  })

  return {
    success: true,
    result: { taskId: task.id, task },
  }
}

async function executeSendEmail(userId, actionData) {
  const { sendEmail } = await import('@/lib/gmail')
  
  await sendEmail(userId, {
    to: actionData.to || actionData.email?.from,
    subject: actionData.subject || `Re: ${actionData.email?.subject || ''}`,
    body: actionData.body || actionData.reply,
    threadId: actionData.threadId || actionData.email?.threadId,
  })

  // Update email status if emailId provided
  if (actionData.emailId) {
    await prisma.email.update({
      where: { id: actionData.emailId },
      data: {
        status: 'REPLIED',
        aiReply: actionData.reply || actionData.body,
      },
    })
  }

  return {
    success: true,
    result: { sent: true },
  }
}

async function executeScheduleFollowUp(userId, actionData) {
  const followUp = await prisma.followUp.create({
    data: {
      userId,
      leadName: actionData.leadName || actionData.followUp?.leadName || '',
      leadPhone: actionData.leadPhone || actionData.followUp?.leadPhone || '',
      leadEmail: actionData.leadEmail || actionData.followUp?.leadEmail || '',
      message: actionData.message || actionData.followUp?.message || 'Follow-up message',
      scheduledFor: new Date(actionData.scheduledFor || actionData.followUp?.scheduledFor || Date.now() + 24 * 60 * 60 * 1000),
      channel: actionData.channel || actionData.followUp?.channel || 'email',
      metadata: actionData.metadata || {},
    },
  })

  return {
    success: true,
    result: { followUpId: followUp.id, followUp },
  }
}

async function executeUpdateCRM(userId, actionData) {
  try {
    const { leadEmail, leadPhone, leadName, status, notes, source } = actionData
    
    // Update or create follow-up record as CRM entry
    // In a full CRM system, this would update a Lead/Contact model
    // For now, we use FollowUp as our CRM tracking mechanism
    if (leadEmail || leadPhone) {
      // Check if follow-up already exists
      const existingFollowUp = await prisma.followUp.findFirst({
        where: {
          userId,
          OR: [
            leadEmail ? { leadEmail } : {},
            leadPhone ? { leadPhone } : {},
          ],
        },
        orderBy: { createdAt: 'desc' },
      })

      if (existingFollowUp) {
        // Update existing follow-up with new status/notes
        const updated = await prisma.followUp.update({
          where: { id: existingFollowUp.id },
          data: {
            ...(status && { status }),
            ...(notes && { 
              message: notes,
              metadata: {
                ...(existingFollowUp.metadata || {}),
                crmStatus: status,
                lastUpdated: new Date().toISOString(),
                source: source || 'ai_agent',
              },
            }),
          },
        })
        
        await saveMemory(userId, `CRM updated: ${leadName || leadEmail} - Status: ${status}`, {
          type: 'crm',
          source: 'agent',
          followUpId: updated.id,
        })

        return {
          success: true,
          result: { followUpId: updated.id, updated: true },
        }
      } else {
        // Create new follow-up as CRM entry
        const newFollowUp = await prisma.followUp.create({
          data: {
            userId,
            leadName: leadName || 'Unknown',
            leadEmail: leadEmail || '',
            leadPhone: leadPhone || '',
            message: notes || 'CRM entry created',
            scheduledFor: new Date(),
            channel: 'email',
            status: status || 'pending',
            metadata: {
              crmStatus: status || 'new',
              source: source || 'ai_agent',
              createdAt: new Date().toISOString(),
            },
          },
        })

        await saveMemory(userId, `CRM entry created: ${leadName || leadEmail}`, {
          type: 'crm',
          source: 'agent',
          followUpId: newFollowUp.id,
        })

        return {
          success: true,
          result: { followUpId: newFollowUp.id, created: true },
        }
      }
    }

    return {
      success: false,
      error: 'Missing lead contact information (email or phone)',
    }
  } catch (error) {
    console.error('[AgentManager] Error updating CRM:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function executeNotifyTaskOverdue(userId, actionData) {
  const { createNotification } = await import('@/lib/notifications')
  
  await createNotification(userId, {
    type: 'urgent',
    title: 'Overdue Task',
    message: `Task "${actionData.task?.title || 'Unknown'}" is overdue`,
    metadata: { taskId: actionData.task?.id },
  })

  return {
    success: true,
    result: { notified: true },
  }
}

async function executeCreateInvoice(userId, actionData) {
  try {
    const { generateInvoicePDF } = await import('@/lib/invoice')
    const { sendEmail } = await import('@/lib/gmail')
    
    const { clientName, clientEmail, items, tax = 0, dueDate, autoSend = false } = actionData

    if (!clientName || !items || !Array.isArray(items)) {
      return {
        success: false,
        error: 'Missing required fields: clientName and items',
      }
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
        clientEmail: clientEmail || null,
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

    // Auto-send email if requested
    if (autoSend && clientEmail) {
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

    await saveMemory(userId, `Invoice created: ${invoiceNumber} for ${clientName}`, {
      type: 'invoice',
      source: 'agent',
      invoiceId: invoice.id,
    })

    return {
      success: true,
      result: { invoiceId: invoice.id, invoice: updatedInvoice },
    }
  } catch (error) {
    console.error('[AgentManager] Error creating invoice:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function executeSendWhatsApp(userId, actionData) {
  try {
    const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
    
    const { phoneNumber, message } = actionData

    if (!phoneNumber || !message) {
      return {
        success: false,
        error: 'Missing required fields: phoneNumber and message',
      }
    }

    const sent = await sendWhatsAppMessage(phoneNumber, message)

    if (sent) {
      await saveMemory(userId, `WhatsApp sent to ${phoneNumber}`, {
        type: 'whatsapp',
        source: 'agent',
        phoneNumber,
      })
    }    return {
      success: sent,
      result: { sent },
      ...(sent ? {} : { error: 'Failed to send WhatsApp message' }),
    }
  } catch (error) {
    console.error('[AgentManager] Error sending WhatsApp:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function executeSendFollowUp(userId, actionData) {
  try {
    const { followUp } = actionData
    if (!followUp || !followUp.id) {
      return {
        success: false,
        error: 'Missing follow-up data',
      }
    }

    const followUpRecord = await prisma.followUp.findUnique({
      where: { id: followUp.id },
    })

    if (!followUpRecord || followUpRecord.status !== 'pending') {
      return {
        success: false,
        error: 'Follow-up not found or already processed',
      }
    }

    // Send via appropriate channel
    if (followUpRecord.channel === 'whatsapp' && followUpRecord.leadPhone) {
      const { sendWhatsAppMessage } = await import('@/lib/whatsapp')
      const sent = await sendWhatsAppMessage(followUpRecord.leadPhone, followUpRecord.message)
      
      if (sent) {
        await prisma.followUp.update({
          where: { id: followUpRecord.id },
          data: { status: 'sent', sentAt: new Date() },
        })
      }
      
      return {
        success: sent,
        result: { sent, channel: 'whatsapp' },
      }
    } else if (followUpRecord.channel === 'email' && followUpRecord.leadEmail) {
      const { sendEmail } = await import('@/lib/gmail')
      await sendEmail(
        userId,
        followUpRecord.leadEmail,
        `Follow-up: ${followUpRecord.message.substring(0, 50)}...`,
        followUpRecord.message
      )
      
      await prisma.followUp.update({
        where: { id: followUpRecord.id },
        data: { status: 'sent', sentAt: new Date() },
      })
      
      return {
        success: true,
        result: { sent: true, channel: 'email' },
      }
    }

    return {
      success: false,
      error: 'Invalid channel or missing contact information',
    }
  } catch (error) {
    console.error('[AgentManager] Error sending follow-up:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function executeNotifyTaskDueSoon(userId, actionData) {
  try {
    const { createNotification } = await import('@/lib/notifications')
    const { task, hoursUntilDue } = actionData
    
    const message = hoursUntilDue !== null
      ? `Task "${task.title}" is due in ${hoursUntilDue} hours`
      : `Task "${task.title}" is due soon`
    
    await createNotification(userId, {
      type: 'info',
      title: 'Task Due Soon',
      message,
      metadata: { taskId: task.id },
    })

    return {
      success: true,
      result: { notified: true },
    }
  } catch (error) {
    console.error('[AgentManager] Error notifying task due soon:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function executeSendCalendarReminder(userId, actionData) {
  try {
    const { createNotification } = await import('@/lib/notifications')
    const { eventId, eventTitle, startTime, minutesUntil } = actionData
    
    const timeMessage = minutesUntil < 60
      ? `in ${minutesUntil} minutes`
      : `in ${Math.floor(minutesUntil / 60)} hours`
    
    await createNotification(userId, {
      type: 'info',
      title: 'Upcoming Event',
      message: `"${eventTitle}" starts ${timeMessage}`,
      metadata: { eventId, startTime },
    })

    return {
      success: true,
      result: { notified: true },
    }
  } catch (error) {
    console.error('[AgentManager] Error sending calendar reminder:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

async function executeSendInvoiceReminder(userId, actionData) {
  try {
    const { sendEmail } = await import('@/lib/gmail')
    const { invoice, daysOverdue } = actionData
    
    if (!invoice.clientEmail) {
      return {
        success: false,
        error: 'No client email available for invoice reminder',
      }
    }

    const invoiceUrl = invoice.pdfUrl 
      ? `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${invoice.pdfUrl}`
      : null
    
    const subject = daysOverdue > 0
      ? `Reminder: Invoice ${invoice.invoiceNumber} is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`
      : `Reminder: Invoice ${invoice.invoiceNumber} Payment Due`
    
    await sendEmail(
      userId,
      invoice.clientEmail,
      subject,
      `Dear ${invoice.clientName},\n\nThis is a reminder that invoice ${invoice.invoiceNumber} for $${invoice.total.toFixed(2)} ${daysOverdue > 0 ? `is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue` : 'is due'}.\n\n${invoiceUrl ? `View invoice: ${invoiceUrl}\n\n` : ''}Please arrange payment at your earliest convenience.\n\nThank you!`,
      `<p>Dear ${invoice.clientName},</p><p>This is a reminder that invoice <strong>${invoice.invoiceNumber}</strong> for <strong>$${invoice.total.toFixed(2)}</strong> ${daysOverdue > 0 ? `is <strong>${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue</strong>` : 'is due'}.</p>${invoiceUrl ? `<p><a href="${invoiceUrl}">View Invoice</a></p>` : ''}<p>Please arrange payment at your earliest convenience.</p><p>Thank you!</p>`
    )

    return {
      success: true,
      result: { sent: true, daysOverdue },
    }
  } catch (error) {
    console.error('[AgentManager] Error sending invoice reminder:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
