import { prisma } from './prisma'
import { sendEmail } from './gmail'
import { sendWhatsAppMessage } from './whatsapp'

export async function createNotification(userId, notification) {
  try {
    const notif = await prisma.notification.create({
      data: {
        userId,
        type: notification.type || 'info',
        title: notification.title,
        message: notification.message,
        link: notification.link,
        metadata: notification.metadata || {},
        read: false,
      },
    })

    // Send via preferred channel if specified
    if (notification.channel) {
      await sendNotificationChannel(userId, notification, notification.channel)
    }

    return notif
  } catch (error) {
    console.error('Error creating notification:', error)
    throw error
  }
}

async function sendNotificationChannel(userId, notification, channel) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    })

    if (!user) return

    switch (channel) {
      case 'email':
        if (user.email) {
          await sendEmail(
            userId,
            user.email,
            notification.title,
            notification.message
          )
        }
        break

      case 'whatsapp':
        // Would need user's phone number
        // await sendWhatsAppMessage(user.phone, notification.message)
        break

      default:
        // Just store in database
        break
    }
  } catch (error) {
    console.error('Error sending notification channel:', error)
  }
}

export async function markNotificationRead(userId, notificationId) {
  try {
    await prisma.notification.update({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error marking notification read:', error)
    throw error
  }
}

export async function getUnreadNotifications(userId) {
  try {
    return await prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })
  } catch (error) {
    console.error('Error getting unread notifications:', error)
    throw error
  }
}

export async function notifyTaskReminder(userId, task) {
  await createNotification(userId, {
    type: 'reminder',
    title: 'Task Reminder',
    message: `Task "${task.title}" is due soon`,
    link: `/tasks?id=${task.id}`,
    metadata: { taskId: task.id, type: 'task_reminder' },
    channel: 'email',
  })
}

export async function notifyOverdueTask(userId, task) {
  await createNotification(userId, {
    type: 'urgent',
    title: 'Overdue Task',
    message: `Task "${task.title}" is overdue`,
    link: `/tasks?id=${task.id}`,
    metadata: { taskId: task.id, type: 'task_overdue' },
    channel: 'email',
  })
}

export async function notifyNewLead(userId, leadData) {
  await createNotification(userId, {
    type: 'lead',
    title: 'New Lead',
    message: `New lead: ${leadData.name || leadData.email}`,
    link: `/inbox`,
    metadata: { leadId: leadData.id, type: 'new_lead' },
  })
}

export async function notifyPaymentReceived(userId, invoice) {
  await createNotification(userId, {
    type: 'success',
    title: 'Payment Received',
    message: `Payment received for invoice ${invoice.invoiceNumber}`,
    link: `/invoices?id=${invoice.id}`,
    metadata: { invoiceId: invoice.id, type: 'payment_received' },
  })
}

