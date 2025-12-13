'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    // Check for OAuth callback errors/success
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    const success = params.get('success')
    const details = params.get('details')

    if (error) {
      let message = 'Gmail connection failed'
      if (error === 'access_denied' || error === 'oauth_error') {
        message = 'Access denied. Please make sure:\n\n1. Go to https://console.cloud.google.com/\n2. Navigate to: APIs & Services → OAuth consent screen\n3. Click "ADD USERS" under "Test users"\n4. Add your email: anuragthippani998@gmail.com\n5. Click "Save"\n6. Try connecting again\n\nIf your app is in "Testing" mode, you MUST add your email as a test user!'
      } else if (error === 'invalid_client') {
        message = 'Invalid OAuth client. Please check your GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env'
      } else if (error === 'redirect_uri_mismatch') {
        message = 'Redirect URI mismatch. Make sure the redirect URI in Google Console matches: http://localhost:3000/api/auth/gmail/callback'
      } else if (error === 'missing_params') {
        message = 'Missing OAuth parameters. Please try connecting again.'
      }
      if (details) {
        message += `\n\nDetails: ${decodeURIComponent(details)}`
      }
      setErrorMessage(message)
      
      // Clean URL
      window.history.replaceState({}, '', '/settings')
    }

    if (success === 'gmail_connected' || success === 'calendar_connected') {
      setSuccessMessage(`${success === 'gmail_connected' ? 'Gmail' : 'Calendar'} connected successfully!`)
      // Clean URL
      window.history.replaceState({}, '', '/settings')
      setTimeout(() => setSuccessMessage(''), 5000)
      // Refresh integrations
      fetchIntegrations()
    }
  }, [])
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [integrations, setIntegrations] = useState({
    gmail: { connected: false },
    calendar: { connected: false },
    whatsapp: { connected: false, configured: false },
  })
  const [billing, setBilling] = useState({ currentPlan: 'FREE', planName: 'Free Plan', status: 'active' })
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    taskReminders: true,
    dailyReports: false,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loadingBilling, setLoadingBilling] = useState(false)
  const [loadingNotifications, setLoadingNotifications] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchIntegrations()
    fetchBilling()
    fetchNotifications()
  }, [])

  // Refresh integrations when tab changes to integrations
  useEffect(() => {
    if (activeTab === 'integrations') {
      fetchIntegrations()
    }
  }, [activeTab])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setProfile(data.user || { name: '', email: '' })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data.integrations || {
          gmail: { connected: false },
          calendar: { connected: false },
          whatsapp: { connected: false, configured: false },
        })
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
    }
  }

  const fetchBilling = async () => {
    setLoadingBilling(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/billing', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setBilling(data.billing || { currentPlan: 'FREE', planName: 'Free Plan', status: 'active' })
      }
    } catch (error) {
      console.error('Error fetching billing:', error)
    } finally {
      setLoadingBilling(false)
    }
  }

  const fetchNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.preferences || {
          emailNotifications: true,
          taskReminders: true,
          dailyReports: false,
        })
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      })
      
      if (response.ok) {
        setSuccessMessage('Profile updated successfully!')
        setTimeout(() => setSuccessMessage(''), 3000)
        fetchProfile()
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      setErrorMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const saveNotifications = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notifications),
      })
      
      if (response.ok) {
        setSuccessMessage('Notification preferences saved!')
        setTimeout(() => setSuccessMessage(''), 3000)
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to save preferences')
      }
    } catch (error) {
      console.error('Error saving notifications:', error)
      setErrorMessage('Failed to save notification preferences')
    } finally {
      setSaving(false)
    }
  }

  const disconnectIntegration = async (provider) => {
    if (!confirm(`Are you sure you want to disconnect ${provider}?`)) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/integrations/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ provider }),
      })
      
      if (response.ok) {
        setSuccessMessage(`${provider} disconnected successfully`)
        setTimeout(() => setSuccessMessage(''), 3000)
        fetchIntegrations()
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to disconnect')
      }
    } catch (error) {
      console.error('Error disconnecting:', error)
      setErrorMessage('Failed to disconnect integration')
    }
  }

  const handleUpgrade = async (plan = 'pro') => {
    try {
      const token = localStorage.getItem('token')
      
      // Get price ID based on plan
      let priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRO_PRICE_ID
      if (plan === 'ai_coo') {
        priceId = process.env.NEXT_PUBLIC_STRIPE_AI_COO_PRICE_ID || process.env.STRIPE_AI_COO_PRICE_ID
      }
      
      if (!priceId) {
        setErrorMessage('Stripe price ID not configured. Please set STRIPE_PRO_PRICE_ID or STRIPE_AI_COO_PRICE_ID in .env')
        return
      }
      
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ priceId }),
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.url) {
          window.location.href = data.url
        } else {
          setErrorMessage('Failed to get checkout URL')
        }
      } else {
        const data = await response.json()
        setErrorMessage(data.error || 'Failed to create checkout session')
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      setErrorMessage('Failed to start upgrade process')
    }
  }

  const tabs = [
    { id: 'profile', name: 'Profile' },
    { id: 'integrations', name: 'Integrations' },
    { id: 'billing', name: 'Billing' },
    { id: 'notifications', name: 'Notifications' },
  ]

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Settings</h1>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex justify-between items-start">
              <div className="text-red-800 whitespace-pre-line">{errorMessage}</div>
              <button
                onClick={() => setErrorMessage('')}
                className="text-red-600 hover:text-red-800 ml-4"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Profile Settings</h2>
              {loading ? (
                <div className="text-center py-8">Loading profile...</div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      placeholder="your@email.com"
                    />
                  </div>
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Integrations</h2>
                <button
                  onClick={fetchIntegrations}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>
              </div>
              
              {/* Gmail Integration */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                      <h3 className="font-medium text-lg">Gmail</h3>
                      {integrations.gmail?.connected && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Connected</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {integrations.gmail?.connected 
                        ? 'Read, send, and manage emails automatically' 
                        : 'Connect your Gmail account to enable email automation'}
                    </p>
                    {integrations.gmail?.connected && integrations.gmail?.account && (
                      <div className="text-xs text-gray-400 mt-2">
                        {integrations.gmail.account.expiresAt && (
                          <span>Expires: {new Date(integrations.gmail.account.expiresAt * 1000).toLocaleDateString()}</span>
                        )}
                      </div>
                    )}
                    {!integrations.gmail?.connected && (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token')
                            const testResponse = await fetch('/api/auth/gmail/test', {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            const testData = await testResponse.json()
                            
                            if (!testData.config.hasClientId || !testData.config.hasClientSecret) {
                              setErrorMessage('Gmail OAuth not configured!\n\nPlease add GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET to your .env file.\n\nSee GMAIL_SETUP_GUIDE.md for instructions.')
                              return
                            }
                            
                            console.log('OAuth Config:', testData.config)
                          } catch (error) {
                            console.error('Error testing OAuth config:', error)
                          }
                          
                          try {
                            const token = localStorage.getItem('token')
                            const response = await fetch('/api/auth/gmail/connect', {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            const data = await response.json()
                            
                            if (data.setupRequired) {
                              setErrorMessage(`Gmail OAuth not configured.\n\n${data.message || 'Please configure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.\n\nSee GMAIL_SETUP_GUIDE.md for instructions.'}`)
                              return
                            }
                            
                            if (data.error) {
                              setErrorMessage(`Error: ${data.error}\n\n${data.message || ''}`)
                              return
                            }
                            
                            if (data.authUrl) {
                              console.log('Redirecting to:', data.authUrl)
                              window.location.href = data.authUrl
                            } else {
                              setErrorMessage('Failed to get authorization URL')
                            }
                          } catch (error) {
                            console.error('Error connecting Gmail:', error)
                            setErrorMessage(`Failed to connect Gmail: ${error.message}`)
                          }
                        }}
                        className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Test OAuth Config
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.gmail?.connected ? (
                      <>
                        <span className="text-green-600 font-medium">✓</span>
                        <button
                          onClick={() => disconnectIntegration('gmail')}
                          className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('token')
                            const response = await fetch('/api/auth/gmail/connect', {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            const data = await response.json()
                            
                            if (data.setupRequired) {
                              setErrorMessage(`Gmail OAuth not configured.\n\n${data.message || 'Please configure GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in your .env file.\n\nSee GMAIL_SETUP_GUIDE.md for instructions.'}`)
                              return
                            }
                            
                            if (data.error) {
                              setErrorMessage(`Error: ${data.error}\n\n${data.message || ''}`)
                              return
                            }
                            
                            if (data.authUrl) {
                              console.log('Redirecting to OAuth URL:', data.authUrl)
                              window.location.href = data.authUrl
                            } else {
                              setErrorMessage('Failed to get authorization URL')
                            }
                          } catch (error) {
                            console.error('Error connecting Gmail:', error)
                            setErrorMessage(`Failed to connect Gmail: ${error.message}`)
                          }
                        }}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Calendar Integration */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z"/>
                      </svg>
                      <h3 className="font-medium text-lg">Google Calendar</h3>
                      {integrations.calendar?.connected && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Connected</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {integrations.calendar?.connected 
                        ? 'Sync events, schedule meetings, and find free time slots' 
                        : 'Connect Google Calendar to enable scheduling automation'}
                    </p>
                    {!integrations.gmail?.connected && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Note: Requires Gmail connection first
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.calendar?.connected ? (
                      <>
                        <span className="text-green-600 font-medium">✓</span>
                        <button
                          onClick={() => disconnectIntegration('calendar')}
                          className="text-sm text-red-600 hover:text-red-800 px-3 py-1 border border-red-200 rounded hover:bg-red-50"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!integrations.gmail?.connected) {
                            setErrorMessage('Please connect Gmail first. Calendar uses the same Google account.')
                            return
                          }
                          try {
                            const token = localStorage.getItem('token')
                            const response = await fetch('/api/auth/gmail/connect', {
                              headers: { Authorization: `Bearer ${token}` },
                            })
                            const data = await response.json()
                            if (data.authUrl) {
                              window.location.href = data.authUrl
                            } else {
                              setErrorMessage('Failed to get authorization URL')
                            }
                          } catch (error) {
                            console.error('Error connecting Calendar:', error)
                            setErrorMessage('Failed to connect Calendar')
                          }
                        }}
                        disabled={!integrations.gmail?.connected}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* WhatsApp Integration */}
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      <h3 className="font-medium text-lg">WhatsApp Business</h3>
                      {integrations.whatsapp?.configured && (
                        <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">Configured</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      {integrations.whatsapp?.configured 
                        ? 'Send automated follow-ups via WhatsApp' 
                        : 'Configure WhatsApp Business API for automated messaging'}
                    </p>
                    {!integrations.whatsapp?.configured && (
                      <div className="text-xs text-gray-400 mt-2 space-y-1">
                        <p>Requires WhatsApp Business API credentials:</p>
                        <ul className="list-disc list-inside ml-2">
                          <li>WHATSAPP_ACCESS_TOKEN</li>
                          <li>WHATSAPP_PHONE_NUMBER_ID</li>
                        </ul>
                        <p className="mt-1 text-yellow-600">Add these to your .env file</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {integrations.whatsapp?.configured ? (
                      <span className="text-green-600 font-medium">✓ Configured</span>
                    ) : (
                      <button
                        disabled
                        className="bg-gray-300 text-gray-500 px-4 py-2 rounded-lg cursor-not-allowed"
                        title="Configure via environment variables"
                      >
                        Configure
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Integration Tips</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>Gmail and Calendar use the same Google account</li>
                      <li>WhatsApp requires API credentials in .env file</li>
                      <li>Disconnecting will stop all automated actions for that service</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Billing & Subscription</h2>
              {loadingBilling ? (
                <div className="text-center py-8">Loading billing information...</div>
              ) : (
                <>
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-medium">Current Plan</h3>
                        <p className="text-sm text-gray-500">{billing.planName}</p>
                        {billing.currentPeriodEnd && (
                          <p className="text-xs text-gray-400 mt-1">
                            Renews on {new Date(billing.currentPeriodEnd).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {billing.canUpgrade && (
                          <button
                            onClick={() => handleUpgrade('pro')}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                          >
                            Upgrade
                          </button>
                        )}
                        {billing.canDowngrade && (
                          <button
                            onClick={() => {
                              setErrorMessage('Please contact support to downgrade your plan')
                            }}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                          >
                            Manage
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-600">
                        Status: <span className={`font-medium ${billing.status === 'active' ? 'text-green-600' : 'text-yellow-600'}`}>
                          {billing.status.charAt(0).toUpperCase() + billing.status.slice(1)}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div>
                    <Link href="/pricing" className="text-primary-600 hover:text-primary-700">
                      View all plans →
                    </Link>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              {loadingNotifications ? (
                <div className="text-center py-8">Loading preferences...</div>
              ) : (
                <>
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                      />
                      <span className="ml-3">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={notifications.taskReminders}
                        onChange={(e) => setNotifications({ ...notifications, taskReminders: e.target.checked })}
                      />
                      <span className="ml-3">Task reminders</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={notifications.dailyReports}
                        onChange={(e) => setNotifications({ ...notifications, dailyReports: e.target.checked })}
                      />
                      <span className="ml-3">Daily reports</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={notifications.followUpAlerts || false}
                        onChange={(e) => setNotifications({ ...notifications, followUpAlerts: e.target.checked })}
                      />
                      <span className="ml-3">Follow-up alerts</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="rounded"
                        checked={notifications.invoiceAlerts || false}
                        onChange={(e) => setNotifications({ ...notifications, invoiceAlerts: e.target.checked })}
                      />
                      <span className="ml-3">Invoice alerts</span>
                    </label>
                  </div>
                  <button
                    onClick={saveNotifications}
                    disabled={saving}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Preferences'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

