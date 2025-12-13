import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { id, status, paidAt } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Invoice ID is required' },
        { status: 400 }
      )
    }

    // Verify invoice belongs to user
    const existing = await prisma.invoice.findFirst({
      where: { id, userId },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const updateData = {}
    if (status !== undefined) updateData.status = status
    if (paidAt !== undefined) {
      updateData.paidAt = paidAt ? new Date(paidAt) : null
      if (status === 'paid' && !paidAt) {
        updateData.paidAt = new Date()
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      invoice,
    })
  } catch (error) {
    console.error('Update invoice error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

