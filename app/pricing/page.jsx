'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const plans = [
  {
    name: 'Free',
    tier: 'FREE',
    price: 0,
    features: [
      '10 tasks per month',
      'Email integration',
      'Basic AI agent',
      '5 follow-ups per month',
    ],
    priceId: null,
  },
  {
    name: 'Pro',
    tier: 'PRO',
    price: 29,
    features: [
      'Unlimited tasks',
      'Email + Calendar integration',
      'Advanced AI agent',
      'Unlimited follow-ups',
      'Invoice generation',
      'Priority support',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro',
  },
  {
    name: 'AI COO',
    tier: 'AI_COO',
    price: 99,
    features: [
      'Everything in Pro',
      'Custom workflows',
      'Advanced memory system',
      'WhatsApp integration',
      'Daily AI reports',
      'Dedicated support',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_AI_COO_PRICE_ID || 'price_ai_coo',
  },
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(null)

  const handleSubscribe = async (priceId) => {
    if (!priceId) {
      router.push('/register')
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login?redirect=pricing')
      return
    }

    setLoading(priceId)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Plan</h1>
        <p className="text-center text-gray-600 mb-12">
          Select the plan that works best for your business
        </p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-white rounded-lg shadow-lg p-8 ${
                plan.tier === 'PRO' ? 'border-2 border-primary-600' : ''
              }`}
            >
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold">${plan.price}</span>
                <span className="text-gray-600">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId)}
                disabled={loading === plan.priceId}
                className={`w-full py-3 rounded-lg font-medium ${
                  plan.tier === 'PRO'
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } disabled:opacity-50`}
              >
                {loading === plan.priceId
                  ? 'Processing...'
                  : plan.price === 0
                  ? 'Get Started'
                  : 'Subscribe'}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/" className="text-primary-600 hover:text-primary-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}



