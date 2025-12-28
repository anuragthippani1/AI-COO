import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { processWorkflowTrigger } from '@/lib/workflow_engine'

// Test endpoint to manually trigger a workflow
export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { workflowId, triggerType, triggerData } = body

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
      },
    })

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    // Use workflow's trigger type if not provided
    const testTriggerType = triggerType || workflow.trigger

    // Use provided trigger data or create sample data
    const testTriggerData = triggerData || {
      test: true,
      timestamp: new Date().toISOString(),
    }

    // Manually trigger the workflow
    await processWorkflowTrigger(userId, testTriggerType, {
      ...testTriggerData,
      workflowId,
      testMode: true,
    })

    return NextResponse.json({
      success: true,
      message: 'Workflow triggered successfully',
      workflowId,
      triggerType: testTriggerType,
    })
  } catch (error) {
    console.error('Test workflow error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}








