import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runAgent } from '@/ai/agent_manager'
import { sendEmail } from '@/lib/gmail'
import { sendWhatsAppMessage } from '@/lib/whatsapp'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { workflowId, triggerData } = body

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Get workflow
    const workflow = await prisma.workflow.findFirst({
      where: {
        id: workflowId,
        userId,
        isActive: true,
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found or inactive' },
        { status: 404 }
      )
    }

    // Execute actions
    const results = []
    for (const action of workflow.actions) {
      try {
        switch (action.type) {
          case 'create_task':
            const task = await prisma.task.create({
              data: {
                userId,
                title: action.payload.title,
                description: action.payload.description,
                priority: action.payload.priority || 'MEDIUM',
                dueDate: action.payload.dueDate ? new Date(action.payload.dueDate) : null,
                source: 'workflow',
                metadata: { workflowId, triggerData },
              },
            })
            results.push({ type: 'create_task', success: true, data: task })
            break

          case 'send_email':
            await sendEmail(
              userId,
              action.payload.to,
              action.payload.subject,
              action.payload.body,
              action.payload.htmlBody
            )
            results.push({ type: 'send_email', success: true })
            break

          case 'send_whatsapp':
            await sendWhatsAppMessage(action.payload.phone, action.payload.message)
            results.push({ type: 'send_whatsapp', success: true })
            break

          case 'run_agent':
            const agentResponse = await runAgent({
              userId,
              type: action.payload.type,
              content: action.payload.content,
              metadata: { ...triggerData, ...action.payload.metadata },
            })
            results.push({ type: 'run_agent', success: true, data: agentResponse })
            break

          default:
            results.push({ type: action.type, success: false, error: 'Unknown action type' })
        }
      } catch (error) {
        console.error(`Error executing action ${action.type}:`, error)
        results.push({ type: action.type, success: false, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      workflowId,
      results,
    })
  } catch (error) {
    console.error('Execute workflow error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

