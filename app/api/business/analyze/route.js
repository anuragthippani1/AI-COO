import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { analyzeBusinessOperations } from '@/ai/business_operations'

export async function POST(request) {
  try {
    const userId = requireAuth(request)

    const analysis = await analyzeBusinessOperations(userId)

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Business analysis error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


