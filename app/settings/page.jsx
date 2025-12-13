'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile')

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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="your@email.com"
                />
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Save Changes
              </button>
            </div>
          )}

          {activeTab === 'integrations' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Integrations</h2>
              
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Gmail</h3>
                    <p className="text-sm text-gray-500">Connect your Gmail account</p>
                  </div>
                  <button
                    onClick={async () => {
                      try {
                        const token = localStorage.getItem('token')
                        const response = await fetch('/api/auth/gmail/connect', {
                          headers: { Authorization: `Bearer ${token}` },
                        })
                        const data = await response.json()
                        if (data.authUrl) {
                          window.location.href = data.authUrl
                        }
                      } catch (error) {
                        console.error('Error connecting Gmail:', error)
                        alert('Failed to connect Gmail')
                      }
                    }}
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Connect
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">WhatsApp</h3>
                    <p className="text-sm text-gray-500">Connect WhatsApp Business API</p>
                  </div>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    Connect
                  </button>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Calendar</h3>
                    <p className="text-sm text-gray-500">Sync with Google Calendar</p>
                  </div>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    Connect
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Billing & Subscription</h2>
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-medium">Current Plan</h3>
                    <p className="text-sm text-gray-500">Free Plan</p>
                  </div>
                  <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                    Upgrade
                  </button>
                </div>
              </div>
              <div>
                <Link href="/pricing" className="text-primary-600 hover:text-primary-700">
                  View all plans →
                </Link>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              <div className="space-y-4">
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="ml-3">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" defaultChecked />
                  <span className="ml-3">Task reminders</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="rounded" />
                  <span className="ml-3">Daily reports</span>
                </label>
              </div>
              <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
                Save Preferences
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}

