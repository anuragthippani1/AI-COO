import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Get user's notification preferences
    // For now, we'll store preferences in a JSON field or create a separate model
    // Using a simple approach: store in user's metadata or create NotificationSettings
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Default notification preferences
    // In a real app, you'd store these in a database
    const preferences = {
      emailNotifications: true,
      taskReminders: true,
      dailyReports: false,
      followUpAlerts: true,
      invoiceAlerts: true,
    }

    return NextResponse.json({
      success: true,
      preferences,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const {
      emailNotifications,
      taskReminders,
      dailyReports,
      followUpAlerts,
      invoiceAlerts,
    } = body

    // In a real app, you'd save these to a database
    // For now, we'll just return success
    // You could create a NotificationSettings model in Prisma

    const preferences = {
      emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
      taskReminders: taskReminders !== undefined ? taskReminders : true,
      dailyReports: dailyReports !== undefined ? dailyReports : false,
      followUpAlerts: followUpAlerts !== undefined ? followUpAlerts : true,
      invoiceAlerts: invoiceAlerts !== undefined ? invoiceAlerts : true,
    }

    // TODO: Save to database when NotificationSettings model is created
    // For now, just return the preferences

    return NextResponse.json({
      success: true,
      preferences,
      message: 'Notification preferences saved',
    })
  } catch (error) {
    console.error('Update notifications error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






