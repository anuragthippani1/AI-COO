'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

function StatusBadge({ status }) {
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
  const map = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    failed: 'bg-red-50 text-red-700 border border-red-100',
    pending_approval: 'bg-amber-50 text-amber-700 border border-amber-100',
    blocked_by_safety: 'bg-orange-50 text-orange-700 border border-orange-100',
    executed: 'bg-gray-100 text-gray-700 border border-gray-200',
    rolled_back: 'bg-blue-50 text-blue-700 border border-blue-100',
  }
  const key = status || 'executed'
  return <span className={`${base} ${map[key] || map.executed}`}>{status}</span>
}

function RiskBadge({ risk }) {
  if (!risk) return null
  const base = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium'
  const map = {
    low: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
    medium: 'bg-amber-50 text-amber-700 border border-amber-100',
    high: 'bg-red-50 text-red-700 border border-red-100',
  }
  const label = risk?.charAt(0).toUpperCase() + risk?.slice(1)
  return <span className={`${base} ${map[risk] || map.medium}`}>{label} risk</span>
}

export default function ActivityPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [statusFilter, setStatusFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('')
  const [limit, setLimit] = useState(20)

  const [rollbackLoadingId, setRollbackLoadingId] = useState(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const params = new URLSearchParams()
      params.set('limit', String(limit))
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (actionFilter.trim()) {
        params.set('actionType', actionFilter.trim())
      }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleApplyFilters = () => {
    fetchLogs()
  }

  const handleRollback = async (log) => {
    try {
      setRollbackLoadingId(log.id)
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
      // TODO: Surface error to user via toast/notification component
      alert(err.message || 'Failed to rollback action')
    } finally {
      setRollbackLoadingId(null)
    }
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Activity Timeline</h1>
            <p className="text-gray-600 mt-1 text-sm md:text-base">
              Review every AI and system action with confidence, risk, and explanations.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <span>🔄</span>
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5">
          <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 mb-1">Action Type</label>
              <input
                type="text"
                placeholder="e.g. generate_reply, schedule_followup"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full md:w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending_approval">Pending approval</option>
                <option value="blocked_by_safety">Blocked by safety</option>
                <option value="executed">Executed</option>
                <option value="rolled_back">Rolled back</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Items</label>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="w-full md:w-32 rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              >
                <option value={20}>Last 20</option>
                <option value={50}>Last 50</option>
                <option value={100}>Last 100</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleApplyFilters}
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setStatusFilter('all')
                  setActionFilter('')
                  setLimit(20)
                  fetchLogs()
                }}
                className="inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-6">
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded-lg" />
                ))}
              </div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                {error}
              </div>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-10 text-center">
              <div className="text-5xl mb-3">🧾</div>
              <h2 className="text-lg font-semibold text-gray-900 mb-1">No activity yet</h2>
              <p className="text-gray-500 text-sm">
                As AI agents work on your behalf, you will see a full audit trail of every action here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.map((log) => {
                const canRollback =
                  log.metadata &&
                  (log.metadata.canRollback === true ||
                    (log.metadata.rollbackExpiresAt &&
                      new Date(log.metadata.rollbackExpiresAt) > new Date())) &&
                  log.status !== 'rolled_back'

                return (
                  <div key={log.id} className="p-4 md:p-5 flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 md:gap-4">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono uppercase tracking-wide text-gray-500">
                            {log.actionType}
                          </span>
                          {log.agentName && (
                            <span className="text-xs text-gray-400">· {log.agentName}</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-2 flex-wrap">
                          <StatusBadge status={log.status} />
                          <RiskBadge risk={log.riskLevel} />
                          {typeof log.confidenceScore === 'number' && (
                            <span className="text-xs text-gray-500">
                              Confidence: {log.confidenceScore}/100
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {canRollback && (
                          <button
                            onClick={() => handleRollback(log)}
                            disabled={rollbackLoadingId === log.id}
                            className="inline-flex items-center justify-center px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {rollbackLoadingId === log.id ? 'Rolling back…' : 'Undo action'}
                          </button>
                        )}
                        <span className="text-xs text-gray-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                        </span>
                      </div>
                    </div>
                    {log.explanation && (
                      <p className="text-xs md:text-sm text-gray-700 mt-1 whitespace-pre-line">
                        {log.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}








