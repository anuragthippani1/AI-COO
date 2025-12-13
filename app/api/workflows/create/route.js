import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { name, description, trigger, actions, isActive = true } = body

    if (!name || !trigger || !actions || !Array.isArray(actions)) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger, actions' },
        { status: 400 }
      )
    }

    const workflow = await prisma.workflow.create({
      data: {
        userId,
        name,
        description,
        trigger,
        actions,
        isActive,
      },
    })

    return NextResponse.json({
      success: true,
      workflow,
    })
  } catch (error) {
    console.error('Create workflow error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

