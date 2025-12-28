import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { trigger, pattern, response, channel = 'email', isActive = true } = body

    if (!trigger || !pattern || !response) {
      return NextResponse.json(
        { error: 'Missing required fields: trigger, pattern, response' },
        { status: 400 }
      )
    }

    const autoResponse = await prisma.autoResponse.create({
      data: {
        userId,
        trigger,
        pattern,
        response,
        channel,
        isActive,
      },
    })

    return NextResponse.json({
      success: true,
      autoResponse,
    })
  } catch (error) {
    console.error('Create auto-response error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








