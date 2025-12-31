'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/analytics'

const steps = [
  {
    id: 1,
    title: 'Welcome to AI COO',
    description: 'Your AI-powered operations assistant that automates email, tasks, and business workflows.',
    icon: '👋',
  },
  {
    id: 2,
    title: 'Connect Your Gmail',
    description: 'Connect your Gmail account to enable email automation, task extraction, and AI-powered replies.',
    icon: '📧',
    action: 'connect_gmail',
  },
  {
    id: 3,
    title: 'Create Your First Task',
    description: 'Try creating a task to see how AI COO helps you stay organized.',
    icon: '✅',
    action: 'create_task',
  },
  {
    id: 4,
    title: 'Set Up Your First Automation',
    description: 'Automate repetitive workflows like auto-replies, task creation, and follow-ups.',
    icon: '⚙️',
    action: 'create_automation',
    optional: true,
  },
  {
    id: 5,
    title: 'Explore Your Dashboard',
    description: 'Your dashboard shows real-time stats, recent tasks, and upcoming follow-ups.',
    icon: '📊',
    action: 'explore_dashboard',
  },
]

export default function OnboardingStepper({ onComplete, onSkip }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState(new Set())

  const currentStepData = steps[currentStep]
  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
      trackEvent('onboarding_step_completed', {
        step: currentStepData.id,
        stepName: currentStepData.title,
      })
    } else {
      handleComplete()
    }
  }

  const handleSkip = () => {
    trackEvent('onboarding_skipped', { step: currentStepData.id })
    onSkip()
  }

  const handleComplete = async () => {
    try {
      const token = localStorage.getItem('token')
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ completed: true }),
      })
      trackEvent('onboarding_completed')
      onComplete()
    } catch (error) {
      console.error('Error marking onboarding complete:', error)
      onComplete() // Still close even if API call fails
    }
  }

  const handleAction = () => {
    if (currentStepData.action === 'connect_gmail') {
      window.location.href = '/api/auth/gmail/connect'
    } else if (currentStepData.action === 'create_task') {
      window.location.href = '/tasks?action=create'
    } else if (currentStepData.action === 'create_automation') {
      window.location.href = '/automations?action=create'
    } else if (currentStepData.action === 'explore_dashboard') {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep + 1} of {steps.length}
              </span>
              <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step content */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">{currentStepData.icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{currentStepData.title}</h2>
            <p className="text-gray-600">{currentStepData.description}</p>
          </div>

          {/* Action button if available */}
          {currentStepData.action && (
            <div className="mb-6">
              <button
                onClick={handleAction}
                className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
              >
                {currentStepData.action === 'connect_gmail' && 'Connect Gmail'}
                {currentStepData.action === 'create_task' && 'Create Task'}
                {currentStepData.action === 'create_automation' && 'Create Automation'}
                {currentStepData.action === 'explore_dashboard' && 'Go to Dashboard'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-2">
            {currentStepData.optional && (
              <button
                onClick={handleSkip}
                className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              {currentStep < steps.length - 1 ? 'Next' : 'Get Started'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}





