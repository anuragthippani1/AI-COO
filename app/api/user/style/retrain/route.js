import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { learnUserStyle, getUserStyleProfile } from '@/ai/user_style_learner'

/**
 * POST /api/user/style/retrain
 * Retrain the user's style profile by analyzing their past emails
 */
export async function POST(request) {
  try {
    const userId = requireAuth(request)

    // Learn/regenerate style profile
    const styleProfile = await learnUserStyle(userId)

    return NextResponse.json({
      success: true,
      message: 'Style profile retrained successfully',
      styleProfile,
      stats: {
        sampleCount: styleProfile.stats?.sampleCount || 0,
        learnedAt: styleProfile.stats?.learnedAt || new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('[Style Retrain] Error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/user/style/retrain
 * Get current style profile
 */
export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Get current style profile
    const styleProfile = await getUserStyleProfile(userId)

    return NextResponse.json({
      success: true,
      styleProfile,
      stats: {
        sampleCount: styleProfile.stats?.sampleCount || 0,
        learnedAt: styleProfile.stats?.learnedAt || null,
      },
    })
  } catch (error) {
    console.error('[Style Get] Error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message,
      },
      { status: 500 }
    )
  }
}









