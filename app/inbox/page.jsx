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

  const fetchEmails = async (refresh = false) => {
    try {
      const token = localStorage.getItem('token')
      
      // If refresh, fetch new emails from Gmail
      if (refresh) {
        const fetchResponse = await fetch('/api/emails/fetch', {
          headers: { Authorization: `Bearer ${token}` },
        })
        
        if (!fetchResponse.ok) {
          const data = await fetchResponse.json()
          if (data.error?.includes('Gmail not connected')) {
            setError('Gmail not connected. Please connect your Gmail account in Settings.')
            setLoading(false)
            return
          } else {
            setError(data.error || 'Failed to fetch emails from Gmail')
            setLoading(false)
            return
          }
        } else {
          const fetchData = await fetchResponse.json()
          if (fetchData.count > 0) {
            setSuccess(`Fetched ${fetchData.count} new email(s) from Gmail`)
            setTimeout(() => setSuccess(''), 3000)
          }
        }
      }
      
      // Always fetch from database
      const response = await fetch('/api/emails/list?limit=50', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
        if (refresh && data.emails?.length > 0) {
          setSuccess(`Fetched ${data.emails.length} email(s) from Gmail`)
          setTimeout(() => setSuccess(''), 3000)
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch emails')
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
      setError('Failed to fetch emails. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const [selectedEmail, setSelectedEmail] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const markAsRead = async (emailId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/emails/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: emailId, status: 'READ' }),
      })
      
      if (response.ok) {
        fetchEmails(false)
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Inbox</h1>
          <div className="text-sm text-gray-500">
            {emails.length} email{emails.length !== 1 ? 's' : ''}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-600">×</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
            <button onClick={() => setSuccess('')} className="ml-4 text-green-600">×</button>
          </div>
        )}
        
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => fetchEmails(true)}
              disabled={loading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Fetch from Gmail'}
            </button>
            <button
              onClick={() => fetchEmails(false)}
              disabled={loading}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Refresh
            </button>
          </div>
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
                <div 
                  key={email.id} 
                  className={`p-4 hover:bg-gray-50 cursor-pointer border-b transition ${
                    email.status === 'UNREAD' ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    setSelectedEmail(email)
                    if (email.status === 'UNREAD') {
                      markAsRead(email.id)
                    }
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{email.from}</h3>
                        {email.status === 'UNREAD' && (
                          <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                            New
                          </span>
                        )}
                        {email.isProcessed && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                            Processed
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-gray-900 mb-1">{email.subject || '(No Subject)'}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {email.body?.substring(0, 150) || email.htmlBody?.replace(/<[^>]*>/g, '').substring(0, 150) || 'No preview available'}...
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        {email.extractedTasks && email.extractedTasks.length > 0 && (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ {email.extractedTasks.length} task(s) extracted
                          </span>
                        )}
                        {email.aiReply && (
                          <span className="text-xs text-blue-600 font-medium">
                            💬 AI reply available
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      <span className="text-xs text-gray-400">
                        {new Date(email.receivedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(email.receivedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Email Detail Modal */}
        {selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{selectedEmail.subject || '(No Subject)'}</h2>
                    <p className="text-sm text-gray-600">
                      From: <span className="font-medium">{selectedEmail.from}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                      To: <span className="font-medium">{selectedEmail.to}</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(selectedEmail.receivedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="border-t pt-4">
                  <div className="prose max-w-none">
                    {selectedEmail.htmlBody ? (
                      <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                    ) : (
                      <p className="whitespace-pre-wrap">{selectedEmail.body || 'No content'}</p>
                    )}
                  </div>
                  {selectedEmail.extractedTasks && selectedEmail.extractedTasks.length > 0 && (
                    <div className="mt-4 p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold mb-2">Extracted Tasks:</h3>
                      <ul className="list-disc list-inside">
                        {selectedEmail.extractedTasks.map((task, idx) => (
                          <li key={idx} className="text-sm">{task}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedEmail.aiReply && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h3 className="font-semibold mb-2">AI Generated Reply:</h3>
                      <p className="text-sm whitespace-pre-wrap">{selectedEmail.aiReply}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

