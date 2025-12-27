import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Get recent activity counts for each agent type
    const [
      inboxActivity,
      taskActivity,
      replyActivity,
      followupActivity,
      proposalActivity,
      invoiceActivity,
    ] = await Promise.all([
      // Inbox Agent - recent emails processed
      prisma.email.count({
        where: {
          userId,
          isProcessed: true,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),

      // Task Agent - recent tasks created
      prisma.task.count({
        where: {
          userId,
          source: { in: ['email', 'ai_generated'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Reply Agent - recent replies generated
      prisma.email.count({
        where: {
          userId,
          aiReply: { not: null },
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Follow-up Agent - recent follow-ups sent
      prisma.followUp.count({
        where: {
          userId,
          status: 'sent',
          sentAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),

      // Proposal Agent - proposals created (would need proposal table)
      0,

      // Invoice Agent - invoices created
      prisma.invoice.count({
        where: {
          userId,
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
          },
        },
      }),
    ])

    const agents = [
      {
        id: '1',
        name: 'Inbox Agent',
        description: 'Reads, sorts, classifies emails and extracts tasks automatically',
        status: 'active',
        lastRun: inboxActivity > 0 ? 'Recently active' : 'No recent activity',
        activityCount: inboxActivity,
        capabilities: ['Email reading', 'Classification', 'Task extraction', 'Priority detection'],
      },
      {
        id: '2',
        name: 'Reply Agent',
        description: 'Writes professional customer replies matching your tone',
        status: 'active',
        lastRun: replyActivity > 0 ? 'Recently active' : 'No recent activity',
        activityCount: replyActivity,
        capabilities: ['Reply generation', 'Tone matching', 'Context awareness'],
      },
      {
        id: '3',
        name: 'Follow-Up Agent',
        description: 'Sends automated follow-ups via WhatsApp and email',
        status: 'active',
        lastRun: followupActivity > 0 ? 'Recently active' : 'No recent activity',
        activityCount: followupActivity,
        capabilities: ['WhatsApp messaging', 'Email follow-ups', 'Auto-stop on reply'],
      },
      {
        id: '4',
        name: 'Task Agent',
        description: 'Creates and manages tasks automatically',
        status: 'active',
        lastRun: taskActivity > 0 ? 'Recently active' : 'No recent activity',
        activityCount: taskActivity,
        capabilities: ['Task extraction', 'Priority assignment', 'Auto-creation'],
      },
      {
        id: '5',
        name: 'Proposal Agent',
        description: 'Creates professional proposals based on services and context',
        status: 'active',
        lastRun: proposalActivity > 0 ? 'Recently active' : 'Never',
        activityCount: proposalActivity,
        capabilities: ['Proposal generation', 'PDF creation', 'Auto-send'],
      },
      {
        id: '6',
        name: 'Invoice Agent',
        description: 'Creates invoices and tracks payment status',
        status: 'active',
        lastRun: invoiceActivity > 0 ? 'Recently active' : 'No recent activity',
        activityCount: invoiceActivity,
        capabilities: ['Invoice generation', 'PDF creation', 'Payment tracking'],
      },
      {
        id: '7',
        name: 'Memory Agent',
        description: 'Learns your writing tone, preferences, and business context',
        status: 'active',
        lastRun: 'Continuous',
        activityCount: 0,
        capabilities: ['Tone learning', 'Context storage', 'Preference tracking'],
      },
      {
        id: '8',
        name: 'Scheduling Agent',
        description: 'Manages calendar and meeting scheduling',
        status: 'active',
        lastRun: 'On demand',
        activityCount: 0,
        capabilities: ['Calendar sync', 'Meeting scheduling', 'Time slot finding'],
      },
    ]

    return NextResponse.json({
      success: true,
      agents,
    })
  } catch (error) {
    console.error('Get agents status error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






