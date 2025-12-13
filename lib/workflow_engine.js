import { prisma } from './prisma'
import { runAgent } from '@/ai/agent_manager'
import { sendEmail } from './gmail'
import { sendWhatsAppMessage } from './whatsapp'

/**
 * Process workflow triggers
 * Called when events occur (email received, task created, etc.)
 */
export async function processWorkflowTrigger(userId, triggerType, triggerData) {
  try {
    // Find active workflows with matching trigger
    const workflows = await prisma.workflow.findMany({
      where: {
        userId,
        trigger: triggerType,
        isActive: true,
      },
    })

    // Execute each workflow
    for (const workflow of workflows) {
      try {
        await executeWorkflow(workflow, triggerData)
      } catch (error) {
        console.error(`Error executing workflow ${workflow.id}:`, error)
      }
    }
  } catch (error) {
    console.error('Error processing workflow trigger:', error)
  }
}

/**
 * Execute a workflow's actions
 */
async function executeWorkflow(workflow, triggerData) {
  for (const action of workflow.actions) {
    try {
      switch (action.type) {
        case 'create_task':
          await prisma.task.create({
            data: {
              userId: workflow.userId,
              title: action.payload.title,
              description: action.payload.description,
              priority: action.payload.priority || 'MEDIUM',
              dueDate: action.payload.dueDate ? new Date(action.payload.dueDate) : null,
              source: 'workflow',
              metadata: { workflowId: workflow.id, triggerData },
            },
          })
          break

        case 'send_email':
          await sendEmail(
            workflow.userId,
            action.payload.to,
            action.payload.subject,
            action.payload.body,
            action.payload.htmlBody
          )
          break

        case 'send_whatsapp':
          await sendWhatsAppMessage(action.payload.phone, action.payload.message)
          break

        case 'run_agent':
          await runAgent({
            userId: workflow.userId,
            type: action.payload.type,
            content: action.payload.content,
            metadata: { ...triggerData, ...action.payload.metadata },
          })
          break

        default:
          console.warn(`Unknown action type: ${action.type}`)
      }
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error)
    }
  }
}

/**
 * Common workflow templates
 */
export const workflowTemplates = {
  emailToTask: {
    name: 'Email to Task',
    description: 'Automatically create tasks from emails',
    trigger: 'email_received',
    actions: [
      {
        type: 'run_agent',
        payload: {
          type: 'email',
          content: '{{emailContent}}',
        },
      },
    ],
  },
  followUpReminder: {
    name: 'Follow-Up Reminder',
    description: 'Send follow-up for overdue tasks',
    trigger: 'task_overdue',
    actions: [
      {
        type: 'send_whatsapp',
        payload: {
          phone: '{{contactPhone}}',
          message: 'Hi {{contactName}}, just following up on {{taskTitle}}. Let me know if you need anything!',
        },
      },
    ],
  },
  newLeadWelcome: {
    name: 'New Lead Welcome',
    description: 'Welcome new leads automatically',
    trigger: 'new_lead',
    actions: [
      {
        type: 'send_email',
        payload: {
          to: '{{leadEmail}}',
          subject: 'Welcome!',
          body: 'Thank you for your interest. We\'ll be in touch soon!',
        },
      },
    ],
  },
}

