import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { processCommand } from '@/ai/nlp_command_center'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { command } = body

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { error: 'Command is required and must be a string' },
        { status: 400 }
      )
    }

    const result = await processCommand(userId, command)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error('Command processing error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}







