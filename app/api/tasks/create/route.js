import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { saveMemory } from '@/lib/memory'
import { processWorkflowTrigger } from '@/lib/workflow_engine'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { title, description, priority = 'MEDIUM', dueDate, status = 'PENDING' } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const task = await prisma.task.create({
      data: {
        userId,
        title,
        description,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null,
        source: 'manual',
      },
    })

    // Save to memory
    await saveMemory(userId, `Task created: ${title} - ${description || ''}`, {
      type: 'task',
      source: 'manual',
      priority,
      taskId: task.id,
    })

    // Trigger workflows for task_created
    await processWorkflowTrigger(userId, 'task_created', {
      taskId: task.id,
      title,
      priority,
      dueDate: task.dueDate,
    })

    return NextResponse.json({
      success: true,
      task,
    })
  } catch (error) {
    console.error('Create task error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

