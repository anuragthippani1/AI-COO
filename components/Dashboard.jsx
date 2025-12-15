'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [usage, setUsage] = useState(null)
  const [usageLoading, setUsageLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    fetchUsageStats()
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchDashboardData()
      fetchUsageStats()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const dashboardData = await response.json()
        setData(dashboardData)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUsageStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/usage/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const usageData = await response.json()
        setUsage(usageData.usage)
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error)
    } finally {
      setUsageLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'HIGH':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'MEDIUM':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'LOW':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-700'
      case 'IN_PROGRESS':
        return 'bg-gray-100 text-gray-700'
      case 'PENDING':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-sm h-32"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800">Error loading dashboard. Please refresh the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
        >
          <span>🔄</span>
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tasks Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="text-2xl">✅</div>
            <Link href="/tasks" className="text-gray-400 hover:text-gray-600 text-xs font-medium">
              View →
            </Link>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Tasks</h3>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{data.stats?.tasks?.total || 0}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{data.stats?.tasks?.pending || 0} pending</span>
            <span>•</span>
            <span>{data.stats?.tasks?.completed || 0} completed</span>
          </div>
        </div>

        {/* Emails Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="text-2xl">📧</div>
            <Link href="/inbox" className="text-gray-400 hover:text-gray-600 text-xs font-medium">
              View →
            </Link>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Unread Emails</h3>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{data.stats?.emails?.unread || 0}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span>{data.stats?.emails?.unread || 0} unread</span>
            <span>•</span>
            <span>{data.stats?.emails?.total || 0} total</span>
          </div>
        </div>

        {/* Follow-ups Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="text-2xl">💬</div>
            <Link href="/automations" className="text-gray-400 hover:text-gray-600 text-xs font-medium">
              View →
            </Link>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Pending Follow-ups</h3>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{data.stats?.followUps?.pending || 0}</p>
          <div className="text-xs text-gray-500">
            Scheduled
          </div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <div className="text-2xl">💰</div>
            <Link href="/reports" className="text-gray-400 hover:text-gray-600 text-xs font-medium">
              View →
            </Link>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-2">Revenue</h3>
          <p className="text-3xl font-semibold text-gray-900 mb-2">{formatCurrency(data.stats?.invoices?.revenue || 0)}</p>
          <div className="text-xs text-gray-500">
            {data.stats?.invoices?.total || 0} invoices
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6 lg:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-gray-900 font-semibold text-sm flex items-center gap-2">
                <span>📊</span> AI Usage This Cycle
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Monitor tokens and actions to stay within your plan limits.
              </p>
            </div>
          </div>
          {usageLoading ? (
            <div className="animate-pulse space-y-3 mt-2">
              <div className="h-3 bg-gray-100 rounded-full" />
              <div className="h-3 bg-gray-100 rounded-full" />
              <div className="h-3 bg-gray-100 rounded-full" />
            </div>
          ) : !usage ? (
            <p className="text-xs text-gray-500 mt-2">Usage data not available right now.</p>
          ) : (
            <div className="space-y-3 mt-2">
              <div>
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span>Daily tokens</span>
                  <span>
                    {usage.daily.tokensUsed.toLocaleString()} /{' '}
                    {usage.daily.limitTokens.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gray-900 rounded-full transition-all"
                    style={{
                      width: `${
                        usage.daily.limitTokens
                          ? Math.min(
                              100,
                              (usage.daily.tokensUsed / usage.daily.limitTokens) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span>Daily actions</span>
                  <span>
                    {usage.daily.actionsCount.toLocaleString()} /{' '}
                    {usage.daily.limitActions.toLocaleString()}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-gray-900 rounded-full transition-all"
                    style={{
                      width: `${
                        usage.daily.limitActions
                          ? Math.min(
                              100,
                              (usage.daily.actionsCount / usage.daily.limitActions) * 100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Plan: <span className="font-medium text-gray-800">{usage.tier}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>✅</span> Recent Tasks
              </h2>
              <Link href="/tasks" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {!data.recentTasks || data.recentTasks.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500 mb-4">No tasks yet</p>
                <Link
                  href="/tasks"
                  className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  Create Your First Task
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentTasks.slice(0, 5).map((task) => (
                  <Link
                    key={task.id}
                    href="/tasks"
                    className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">
                        {task.title}
                      </h3>
                      {task.dueDate && (
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                          {formatDate(task.dueDate)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)}`}>
                        {task.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Follow-ups */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span>💬</span> Upcoming Follow-ups
              </h2>
              <Link href="/automations" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                View all →
              </Link>
            </div>
          </div>
          <div className="p-6">
            {!data.upcomingFollowUps || data.upcomingFollowUps.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-gray-500 mb-4">No follow-ups scheduled</p>
                <Link
                  href="/automations"
                  className="inline-block bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                >
                  Create Follow-up
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.upcomingFollowUps.slice(0, 5).map((followUp) => (
                  <div
                    key={followUp.id}
                    className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{followUp.leadName}</h3>
                      <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                        {formatDate(followUp.scheduledFor)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {followUp.channel}
                      </span>
                      {followUp.leadEmail && (
                        <span className="text-xs text-gray-500">{followUp.leadEmail}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/inbox"
            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">📧</div>
            <div className="font-medium text-gray-900 text-sm">Check Inbox</div>
          </Link>
          <Link
            href="/tasks"
            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">✅</div>
            <div className="font-medium text-gray-900 text-sm">New Task</div>
          </Link>
          <Link
            href="/automations"
            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">⚙️</div>
            <div className="font-medium text-gray-900 text-sm">Automations</div>
          </Link>
          <Link
            href="/reports"
            className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-center"
          >
            <div className="text-2xl mb-2">📈</div>
            <div className="font-medium text-gray-900 text-sm">View Reports</div>
          </Link>
        </div>
      </div>
    </div>
  )
}

