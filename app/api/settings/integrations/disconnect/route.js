import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()
    const { provider } = body

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      )
    }

    // Delete the account/integration
    await prisma.account.deleteMany({
      where: {
        userId,
        provider: provider === 'gmail' || provider === 'calendar' ? 'google' : provider,
      },
    })

    return NextResponse.json({
      success: true,
      message: `${provider} disconnected successfully`,
    })
  } catch (error) {
    console.error('Disconnect integration error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}











