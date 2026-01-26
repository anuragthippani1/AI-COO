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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 text-lg">
            Select the plan that works best for your business
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.tier}
              className={`bg-white rounded-xl shadow-lg p-8 transition-all duration-200 ${
                plan.tier === 'PRO' ? 'border-2 border-blue-500 ring-2 ring-blue-100 scale-105' : 'border border-gray-200 hover:border-blue-200 hover:shadow-xl'
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
                className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                  plan.tier === 'PRO'
                    ? 'bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white hover:from-blue-700 hover:via-cyan-600 hover:to-blue-700 shadow-sm hover:shadow-md'
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
          <Link href="/" className="text-blue-600 hover:text-cyan-600 font-medium transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}



