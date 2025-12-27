import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { getCashFlow, predictCashFlow } from '@/lib/finance'

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
    const includePrediction = searchParams.get('predict') === 'true'

    const cashFlow = await getCashFlow(userId, startDate, endDate)
    
    let predictions = null
    if (includePrediction) {
      predictions = await predictCashFlow(userId, 3)
    }

    return NextResponse.json({
      success: true,
      cashFlow,
      predictions,
    })
  } catch (error) {
    console.error('Cash flow error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






