import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const userId = requireAuth(request)

    // Get user with subscription
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const subscription = user.subscription || {
      tier: 'FREE',
      status: 'active',
      currentPeriodEnd: null,
      stripeSubscriptionId: null,
    }

    // Format subscription info
    const billingInfo = {
      currentPlan: subscription.tier,
      planName: subscription.tier === 'FREE' ? 'Free Plan' : 
                subscription.tier === 'PRO' ? 'Pro Plan' : 
                subscription.tier === 'AI_COO' ? 'AI COO Plan' : 'Free Plan',
      status: subscription.status || 'active',
      currentPeriodEnd: subscription.currentPeriodEnd,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
      canUpgrade: subscription.tier === 'FREE',
      canDowngrade: subscription.tier !== 'FREE',
    }

    return NextResponse.json({
      success: true,
      billing: billingInfo,
    })
  } catch (error) {
    console.error('Get billing error:', error)
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}











