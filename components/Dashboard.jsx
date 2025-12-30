'use client'

import { useEffect, useState, useCallback } from 'react'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  CheckSquare,
  Mail,
  MessageSquare,
  DollarSign,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Calendar,
  Zap,
  Inbox,
  Plus,
  Settings,
  BarChart3,
  Clock,
  Activity,
} from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [agentLoopStatus, setAgentLoopStatus] = useState(null)

  const checkAgentLoopStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/agent/loop', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setAgentLoopStatus(data.isRunning)
      }
    } catch (err) {
      console.error('Error checking agent loop status:', err)
    }
  }, [])

  const startAgentLoop = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/agent/loop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'start' }),
      })

      if (response.ok) {
        checkAgentLoopStatus()
      }
    } catch (err) {
      console.error('Error starting agent loop:', err)
    }
  }, [checkAgentLoopStatus])

  useEffect(() => {
    fetchDashboardData()
    checkAgentLoopStatus()
    startAgentLoop()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      checkAgentLoopStatus()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchDashboardData, checkAgentLoopStatus, startAgentLoop])

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        console.error('No token found')
        setLoading(false)
        return
      }

      // Fetch decision-based briefing instead of static stats
      const response = await fetch('/api/dashboard/briefing', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const briefingData = await response.json()
        setData(briefingData.briefing)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error fetching dashboard data:', errorData.error || 'Unknown error')
        if (response.status === 401) {
          // Token expired or invalid - redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-50 text-red-700 border-red-200'
      case 'HIGH':
        return 'bg-orange-50 text-orange-700 border-orange-200'
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      case 'LOW':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700'
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700'
      case 'PENDING':
        return 'bg-gray-50 text-gray-700'
      default:
        return 'bg-gray-50 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-10 bg-gray-200 rounded-lg w-64 mb-2"></div>
          <div className="h-5 bg-gray-200 rounded-lg w-96"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm h-36 border border-gray-100"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data && !loading) {
    return (
      <div className="p-8">
        <div className="bg-white border border-red-200 rounded-xl p-8 text-center shadow-sm max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-gray-900 font-medium mb-2">Error loading dashboard</p>
          <p className="text-sm text-gray-500 mb-6">Please try again or refresh the page</p>
          <button
            onClick={() => {
              setLoading(true)
              fetchDashboardData()
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 lg:p-10 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-semibold text-gray-900">AI COO Briefing</h1>
            {agentLoopStatus !== null && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                agentLoopStatus 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${
                  agentLoopStatus ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                {agentLoopStatus ? 'Agents Active' : 'Agents Paused'}
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            {data?.today?.summary || 'Here&apos;s what I handled for you today.'}
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 shadow-sm hover:shadow"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Needs Attention */}
      {data?.needsAttention && (data.needsAttention.approvals > 0 || data.needsAttention.urgent > 0) && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Needs Your Attention</h2>
              <div className="space-y-2">
                {data.needsAttention.approvals > 0 && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{data.needsAttention.approvals}</span> action{data.needsAttention.approvals !== 1 ? 's' : ''} waiting for approval
                  </p>
                )}
                {data.needsAttention.urgent > 0 && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{data.needsAttention.urgent}</span> urgent item{data.needsAttention.urgent !== 1 ? 's' : ''} detected
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {data?.pendingApprovals && data.pendingApprovals.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Actions Waiting for Approval</h2>
            </div>
          </div>
          <div className="p-6 space-y-3">
            {data.pendingApprovals.map((approval) => (
              <div
                key={approval.id}
                className="p-4 rounded-lg border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{approval.icon}</span>
                      <h3 className="font-medium text-gray-900">{approval.action}</h3>
                    </div>
                    {approval.explanation && (
                      <p className="text-sm text-gray-600 mb-2">{approval.explanation}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {approval.confidence && (
                        <span>Confidence: {approval.confidence}%</span>
                      )}
                      {approval.risk && (
                        <span className={`px-2 py-1 rounded ${
                          approval.risk === 'high' ? 'bg-red-100 text-red-700' :
                          approval.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {approval.risk} risk
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/activity?approval=${approval.id}`}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Urgent Items */}
      {data?.urgentItems && data.urgentItems.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-red-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                <Zap className="w-4 h-4 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Urgent Items</h2>
            </div>
          </div>
          <div className="p-6 space-y-2">
            {data.urgentItems.map((item) => (
              <Link
                key={item.id}
                href={item.url}
                className="block p-4 rounded-lg border border-red-200 hover:border-red-300 hover:bg-red-50/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{item.title}</h3>
                    {item.from && (
                      <p className="text-sm text-gray-600">From: {item.from}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                    item.priority === 'URGENT' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }`}>
                    {item.priority}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {data?.activities && data.activities.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">What I Did Today</h2>
              </div>
              <Link
                href="/activity"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
              >
                View all
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6 space-y-2">
            {data.activities.slice(0, 10).map((activity) => (
              <div
                key={activity.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{activity.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900">{activity.action}</p>
                      {activity.confidence && (
                        <span className="text-xs text-gray-500">({activity.confidence}% confidence)</span>
                      )}
                    </div>
                    {activity.explanation && (
                      <p className="text-sm text-gray-600 mb-2">{activity.explanation}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(activity.timestamp)}</span>
                      {activity.risk && (
                        <span className={`px-2 py-0.5 rounded ${
                          activity.risk === 'high' ? 'bg-red-100 text-red-700' :
                          activity.risk === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {activity.risk} risk
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State - No Activity Yet */}
      {!loading && (!data || (data.activities?.length === 0 && data.pendingApprovals?.length === 0 && data.urgentItems?.length === 0)) && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">No activity yet</p>
          <p className="text-xs text-gray-500 mb-6">Connect your Gmail account to start processing emails automatically</p>
          <Link
            href="/settings"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 text-sm font-medium shadow-sm hover:shadow"
          >
            <Settings className="w-4 h-4" />
            Go to Settings
          </Link>
        </div>
      )}
    </div>
  )
}
