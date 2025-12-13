'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'

export default function InboxPage() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/emails/fetch', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
      } else if (response.status === 400) {
        const data = await response.json()
        if (data.error?.includes('Gmail not connected')) {
          // Show message but don't set error state
          console.log('Gmail not connected')
        }
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Inbox</h1>
        
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={fetchEmails}
            disabled={loading}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh Emails'}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading emails...</div>
        ) : emails.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No emails yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Connect your Gmail account in Settings to start receiving emails
            </p>
            <Link
              href="/settings"
              className="text-primary-600 hover:text-primary-700"
            >
              Go to Settings →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y">
              {emails.map((email) => (
                <div key={email.id} className="p-4 hover:bg-gray-50 cursor-pointer border-b">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{email.from}</h3>
                        {email.status === 'UNREAD' && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{email.subject}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {email.body?.substring(0, 150) || 'No preview available'}...
                      </p>
                      {email.extractedTasks && email.extractedTasks.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-green-600 font-medium">
                            {email.extractedTasks.length} task(s) extracted
                          </span>
                        </div>
                      )}
                      {email.aiReply && (
                        <div className="mt-2">
                          <span className="text-xs text-blue-600 font-medium">
                            AI reply generated
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 ml-4">
                      {new Date(email.receivedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

