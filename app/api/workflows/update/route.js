import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { id, name, description, trigger, actions, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      )
    }

    // Verify workflow belongs to user
    const existing = await prisma.workflow.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      )
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (trigger !== undefined) updateData.trigger = trigger
    if (actions !== undefined) updateData.actions = actions
    if (isActive !== undefined) updateData.isActive = isActive

    const workflow = await prisma.workflow.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      workflow,
    })
  } catch (error) {
    console.error('Update workflow error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

