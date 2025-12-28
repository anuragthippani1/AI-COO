'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardLayout from '@/components/DashboardLayout'
import { format } from 'date-fns'

export default function InboxPage() {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [fetching, setFetching] = useState(false)
  const [selectedEmail, setSelectedEmail] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [filter, setFilter] = useState('all') // all, unread, read

  useEffect(() => {
    fetchEmails(false)
  }, [])

  const fetchEmails = async (fromGmail = false) => {
    try {
      if (fromGmail) {
        setFetching(true)
      } else {
        setLoading(true)
      }
      setError('')
      setSuccess('')
      
      const token = localStorage.getItem('token')
      
      // If fetching from Gmail, call the fetch endpoint
      if (fromGmail) {
        try {
          const fetchResponse = await fetch('/api/emails/fetch', {
            headers: { Authorization: `Bearer ${token}` },
          })
          
          if (!fetchResponse.ok) {
            const data = await fetchResponse.json()
            if (data.error?.includes('Gmail not connected')) {
              setError('Gmail not connected. Please connect your Gmail account in Settings.')
              setFetching(false)
              // Still try to load existing emails
            } else {
              setError(data.error || 'Failed to fetch emails from Gmail')
              setFetching(false)
              // Still try to load existing emails
            }
          } else {
            const fetchData = await fetchResponse.json()
            if (fetchData.count > 0) {
              setSuccess(`Fetched ${fetchData.count} new email(s) from Gmail`)
              setTimeout(() => setSuccess(''), 5000)
            } else {
              setSuccess('No new emails found')
              setTimeout(() => setSuccess(''), 3000)
            }
          }
        } catch (fetchError) {
          console.error('Error fetching from Gmail:', fetchError)
          setError('Failed to fetch emails from Gmail. Please try again.')
          // Still try to load existing emails
        }
      }
      
      // Always fetch from database
      const statusParam = filter !== 'all' ? `&status=${filter.toUpperCase()}` : ''
      const response = await fetch(`/api/emails/list?limit=50${statusParam}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setEmails(data.emails || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to load emails')
      }
    } catch (error) {
      console.error('Error fetching emails:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
      setFetching(false)
    }
  }

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
        // Update local state
        setEmails(emails.map(email => 
          email.id === emailId ? { ...email, status: 'READ' } : email
        ))
        if (selectedEmail?.id === emailId) {
          setSelectedEmail({ ...selectedEmail, status: 'READ' })
        }
      }
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const handleEmailClick = (email) => {
    setSelectedEmail(email)
    if (email.status === 'UNREAD') {
      markAsRead(email.id)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (filter === 'unread') return email.status === 'UNREAD'
    if (filter === 'read') return email.status === 'READ'
    return true
  })

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Inbox</h1>
            <p className="text-gray-600 mt-1">
              {emails.length} email{emails.length !== 1 ? 's' : ''} total
              {emails.filter(e => e.isProcessed).length > 0 && (
                <span className="ml-2 text-sm text-indigo-600">
                  • {emails.filter(e => e.isProcessed).length} processed by AI
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchEmails(true)}
              disabled={fetching || loading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
              title="Emails are automatically processed when fetched"
            >
              {fetching ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>📧</span>
                  <span>Fetch & Process</span>
                </>
              )}
            </button>
            <button
              onClick={() => fetchEmails(false)}
              disabled={loading || fetching}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Refresh</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-start">
            <p className="text-red-800 text-sm">{error}</p>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 ml-4">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-start">
            <p className="text-green-800 text-sm">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800 ml-4">
              ×
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'unread'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Unread
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === 'read'
                ? 'bg-gray-900 text-white'
                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Read
          </button>
        </div>

        {/* Email List */}
        {loading ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-500 mb-2 text-lg font-medium">No emails found</p>
            <p className="text-sm text-gray-400 mb-6">
              {filter === 'all' 
                ? 'Connect your Gmail account in Settings to start receiving emails'
                : `No ${filter} emails found`
              }
            </p>
            {filter === 'all' && (
              <Link
                href="/settings"
                className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
              >
                Go to Settings →
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  className={`p-5 hover:bg-gray-50 cursor-pointer transition-colors ${
                    email.status === 'UNREAD' ? 'bg-gray-50 border-l-4 border-gray-900' : ''
                  }`}
                  onClick={() => handleEmailClick(email)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900 truncate">{email.from}</h3>
                        {email.status === 'UNREAD' && (
                          <span className="bg-gray-900 text-white text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                            New
                          </span>
                        )}
                        {email.isProcessed && (
                          <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap">
                            Processed
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-2 truncate">
                        {email.subject || '(No Subject)'}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {email.body?.substring(0, 200) || 
                         email.htmlBody?.replace(/<[^>]*>/g, '').substring(0, 200) || 
                         'No preview available'}
                      </p>
                      <div className="flex items-center gap-4 flex-wrap">
                        {email.extractedTasks && email.extractedTasks.length > 0 && (
                          <span className="text-xs text-gray-600 font-medium">
                            ✓ {email.extractedTasks.length} task{email.extractedTasks.length !== 1 ? 's' : ''} extracted
                          </span>
                        )}
                        {email.aiReply && (
                          <span className="text-xs text-gray-600 font-medium">
                            💬 AI reply available
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {format(new Date(email.receivedAt), 'MMM dd, yyyy • hh:mm a')}
                        </span>
                      </div>
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
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                      {selectedEmail.subject || '(No Subject)'}
                    </h2>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">From:</span> {selectedEmail.from}
                      </p>
                      <p>
                        <span className="font-medium">To:</span> {selectedEmail.to}
                      </p>
                      <p>
                        <span className="font-medium">Date:</span>{' '}
                        {format(new Date(selectedEmail.receivedAt), 'MMM dd, yyyy • hh:mm a')}
                      </p>
                      <p>
                        <span className="font-medium">Status:</span> {selectedEmail.status}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl ml-4"
                  >
                    ×
                  </button>
                </div>

                <div className="prose max-w-none mb-6">
                  {selectedEmail.htmlBody ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedEmail.htmlBody }} />
                  ) : (
                    <p className="whitespace-pre-wrap text-gray-700">{selectedEmail.body || 'No content'}</p>
                  )}
                </div>

                {selectedEmail.extractedTasks && selectedEmail.extractedTasks.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">Extracted Tasks:</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {Array.isArray(selectedEmail.extractedTasks) ? (
                        selectedEmail.extractedTasks.map((task, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            {typeof task === 'object' ? task.title || JSON.stringify(task) : task}
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-700">{selectedEmail.extractedTasks}</li>
                      )}
                    </ul>
                  </div>
                )}

                {selectedEmail.aiReply && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h3 className="font-semibold text-gray-900 mb-3">AI Generated Reply:</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedEmail.aiReply}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
