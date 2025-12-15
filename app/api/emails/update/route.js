import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { id, status } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      )
    }

    // Verify email belongs to user
    const existing = await prisma.email.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      )
    }

    const updateData = {}
    if (status !== undefined) {
      updateData.status = status.toUpperCase()
    }

    const email = await prisma.email.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      email,
    })
  } catch (error) {
    console.error('Update email error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


