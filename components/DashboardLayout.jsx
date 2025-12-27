'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import OnboardingStepper from './OnboardingStepper'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    // Check onboarding status (non-blocking)
    const checkOnboarding = async () => {
      try {
        const response = await fetch('/api/user/onboarding', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const data = await response.json()
          if (!data.onboardingCompleted) {
            setShowOnboarding(true)
          }
        }
      } catch (error) {
        // Silently fail - don't block dashboard if onboarding check fails
        console.error('Error checking onboarding:', error)
      } finally {
        setCheckingOnboarding(false)
      }
    }

    // Don't block dashboard loading if onboarding check fails
    checkOnboarding().catch(() => {
      setCheckingOnboarding(false)
    })
  }, [router])

  if (checkingOnboarding) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 min-h-screen">
          {children}
        </main>
      </div>
      {showOnboarding && (
        <OnboardingStepper
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}
    </div>
  )
}

