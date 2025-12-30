'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import ActivityTimeline from '@/components/ActivityTimeline'

export default function ActivityPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [limit] = useState(100) // Increased for better timeline view

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const params = new URLSearchParams()
      params.set('limit', String(limit))

      const response = await fetch(`/api/activity/logs?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      })

      if (!response.ok) {
        throw new Error('Failed to load activity logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
    } catch (err) {
      console.error('Error fetching activity logs:', err)
      setError(err.message || 'Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchLogs, 30000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApprove = async (log) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      
      // Find approval request ID from log metadata or use log ID
      const approvalRequestId = log.metadata?.approvalRequestId || log.approvalRequestId || log.id

      const response = await fetch('/api/ai/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ approvalRequestId }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve action')
      }

      // Refresh list after successful approval
      fetchLogs()
    } catch (err) {
      console.error('Error approving action:', err)
      alert(err.message || 'Failed to approve action')
    }
  }

  const handleRollback = async (log) => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

      const response = await fetch('/api/activity/rollback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ activityLogId: log.id }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'Rollback failed')
      }

      // Refresh list after successful rollback
      fetchLogs()
    } catch (err) {
      console.error('Error performing rollback:', err)
      alert(err.message || 'Failed to undo action')
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Activity Timeline</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Complete audit trail of all AI COO actions and decisions
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Activity Timeline */}
        <ActivityTimeline
          logs={logs}
          loading={loading}
          onApprove={handleApprove}
          onRollback={handleRollback}
          onRefresh={fetchLogs}
        />
      </div>
    </DashboardLayout>
  )
}








