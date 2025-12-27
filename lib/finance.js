import { prisma } from './prisma'
import { createNotification } from './notifications'

export async function trackExpense(userId, expenseData) {
  try {
    const expense = await prisma.expense.create({
      data: {
        userId,
        category: expenseData.category,
        description: expenseData.description,
        amount: expenseData.amount,
        date: expenseData.date ? new Date(expenseData.date) : new Date(),
        receiptUrl: expenseData.receiptUrl,
        metadata: expenseData.metadata,
      },
    })

    return expense
  } catch (error) {
    console.error('Error tracking expense:', error)
    throw error
  }
}

export async function getCashFlow(userId, startDate, endDate) {
  try {
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          userId,
          status: 'paid',
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      prisma.expense.findMany({
        where: {
          userId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ])

    const revenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
    const expensesTotal = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
    const netCashFlow = revenue - expensesTotal

    return {
      revenue,
      expenses: expensesTotal,
      netCashFlow,
      invoiceCount: invoices.length,
      expenseCount: expenses.length,
    }
  } catch (error) {
    console.error('Error calculating cash flow:', error)
    throw error
  }
}

export async function predictCashFlow(userId, months = 3) {
  try {
    const now = new Date()
    const pastMonths = 6

    // Get historical data
    const startDate = new Date(now.getFullYear(), now.getMonth() - pastMonths, 1)
    const endDate = new Date(now.getFullYear(), now.getMonth(), 0)

    const historical = await getCashFlow(userId, startDate, endDate)

    // Simple prediction based on average
    const monthlyRevenue = historical.revenue / pastMonths
    const monthlyExpenses = historical.expenses / pastMonths

    const predictions = []
    for (let i = 1; i <= months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      predictions.push({
        month: monthDate.toISOString().substring(0, 7),
        predictedRevenue: monthlyRevenue,
        predictedExpenses: monthlyExpenses,
        predictedNetFlow: monthlyRevenue - monthlyExpenses,
      })
    }

    return {
      historical,
      predictions,
      averageMonthlyRevenue: monthlyRevenue,
      averageMonthlyExpenses: monthlyExpenses,
    }
  } catch (error) {
    console.error('Error predicting cash flow:', error)
    throw error
  }
}

export async function checkUnpaidInvoices(userId) {
  try {
    const unpaidInvoices = await prisma.invoice.findMany({
      where: {
        userId,
        status: { in: ['sent', 'draft'] },
        dueDate: {
          lte: new Date(),
        },
      },
    })

    // Create notifications for overdue invoices
    for (const invoice of unpaidInvoices) {
      await createNotification(userId, {
        type: 'urgent',
        title: 'Overdue Invoice',
        message: `Invoice ${invoice.invoiceNumber} is overdue. Amount: $${invoice.total}`,
        link: `/invoices?id=${invoice.id}`,
        metadata: { invoiceId: invoice.id, type: 'invoice_overdue' },
      })
    }

    return unpaidInvoices
  } catch (error) {
    console.error('Error checking unpaid invoices:', error)
    throw error
  }
}

export async function generateFinancialReport(userId, startDate, endDate) {
  try {
    const cashFlow = await getCashFlow(userId, startDate, endDate)
    const predictions = await predictCashFlow(userId, 3)

    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.expense.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 50,
      }),
    ])

    // Categorize expenses
    const expensesByCategory = {}
    expenses.forEach((exp) => {
      expensesByCategory[exp.category] = (expensesByCategory[exp.category] || 0) + exp.amount
    })

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      cashFlow,
      predictions,
      invoices: {
        total: invoices.length,
        paid: invoices.filter((i) => i.status === 'paid').length,
        unpaid: invoices.filter((i) => i.status !== 'paid').length,
        totalRevenue: invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.total || 0), 0),
      },
      expenses: {
        total: expenses.length,
        byCategory: expensesByCategory,
        totalAmount: expenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      },
      insights: generateFinancialInsights(cashFlow, predictions),
    }
  } catch (error) {
    console.error('Error generating financial report:', error)
    throw error
  }
}

function generateFinancialInsights(cashFlow, predictions) {
  const insights = []

  if (cashFlow.netCashFlow < 0) {
    insights.push({
      type: 'warning',
      message: 'Negative cash flow detected. Consider reducing expenses or increasing revenue.',
    })
  }

  if (predictions.averageMonthlyExpenses > predictions.averageMonthlyRevenue * 0.8) {
    insights.push({
      type: 'warning',
      message: 'Expenses are high relative to revenue. Monitor spending closely.',
    })
  }

  if (cashFlow.netCashFlow > 0 && predictions.predictedNetFlow > 0) {
    insights.push({
      type: 'success',
      message: 'Positive cash flow trend. Business is financially healthy.',
    })
  }

  return insights
}







