import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { generatePreview } from '@/ai/preview_engine'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { actionType, input, proposedAction } = body

    if (!actionType || !input || !proposedAction) {
      return NextResponse.json(
        { error: 'Missing required fields: actionType, input, proposedAction' },
        { status: 400 }
      )
    }

    const preview = await generatePreview(userId, actionType, input, proposedAction)

    return NextResponse.json({
      success: true,
      preview: preview.preview,
      confidence: preview.confidence,
      explanation: preview.explanation,
    })
  } catch (error) {
    console.error('Generate preview error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}










