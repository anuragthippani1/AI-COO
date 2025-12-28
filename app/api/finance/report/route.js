import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { generateFinancialReport } from '@/lib/finance'

export async function GET(request) {
  try {
    const userId = requireAuth(request)
    const { searchParams } = new URL(request.url)
    
    const startDate = searchParams.get('startDate')
      ? new Date(searchParams.get('startDate'))
      : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    const endDate = searchParams.get('endDate')
      ? new Date(searchParams.get('endDate'))
      : new Date()

    const report = await generateFinancialReport(userId, startDate, endDate)

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Financial report error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}








