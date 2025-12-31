import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { trackExpense } from '@/lib/finance'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { category, description, amount, date, receiptUrl } = body

    if (!category || !description || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: category, description, amount' },
        { status: 400 }
      )
    }

    const expense = await trackExpense(userId, {
      category,
      description,
      amount: parseFloat(amount),
      date,
      receiptUrl,
    })

    return NextResponse.json({
      success: true,
      expense,
    })
  } catch (error) {
    console.error('Create expense error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}










