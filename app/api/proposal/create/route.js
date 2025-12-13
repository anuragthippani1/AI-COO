import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateProposal } from '@/ai/proposal_generator'
import { saveMemory } from '@/lib/memory'

export async function POST(request) {
  try {
    const userId = requireAuth(request)
    const body = await request.json()

    const { clientName, clientEmail, services, pricing, notes } = body

    if (!clientName || !services || !Array.isArray(services)) {
      return NextResponse.json(
        { error: 'Missing required fields: clientName, services' },
        { status: 400 }
      )
    }

    // Generate proposal
    const proposal = await generateProposal(
      userId,
      { name: clientName, email: clientEmail },
      services,
      pricing || []
    )

    // Save to memory
    await saveMemory(
      userId,
      `Proposal generated for ${clientName}: ${services.map((s) => s.name).join(', ')}`,
      {
        type: 'proposal',
        clientName,
        services: services.map((s) => s.name),
      }
    )

    return NextResponse.json({
      success: true,
      proposal: {
        text: proposal.proposalText,
        pdfUrl: proposal.pdfUrl,
        clientName,
        clientEmail,
        services,
        pricing,
      },
    })
  } catch (error) {
    console.error('Create proposal error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

