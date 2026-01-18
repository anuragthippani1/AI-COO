import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getUsageStats } from '@/lib/cost_guard'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'today'

    const stats = await getUsageStats(userId, period)

    return NextResponse.json({
      success: true,
      stats,
    })
  } catch (error) {
    console.error('Get usage stats error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}











