'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reports/daily', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const summary = data.report?.summary || {}
        setStats({
          tasks: {
            total: (summary.tasks?.pending || 0) + (summary.tasks?.completed || 0),
            pending: summary.tasks?.pending || 0,
            completed: summary.tasks?.completed || 0,
          },
          emails: {
            total: summary.emails?.unread || 0,
            unread: summary.emails?.unread || 0,
          },
          followUps: {
            pending: summary.followUps?.pending || 0,
          },
          invoices: {
            total: 0,
            revenue: summary.revenue?.total || 0,
          },
        })
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError('Failed to fetch reports. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, subValue, icon, colorClass = 'text-gray-800' }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-gray-300 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <span className={`text-xl ${colorClass}`}>{icon}</span>
      </div>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {subValue && <p className="text-sm text-gray-600 mt-1">{subValue}</p>}
    </div>
  )

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Track your business performance</p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : '🔄'}
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                title="Total Tasks"
                value={stats.tasks?.total || 0}
                subValue={`${stats.tasks?.completed || 0} completed`}
                icon="✅"
                colorClass="text-blue-600"
              />
              <StatCard
                title="Unread Emails"
                value={stats.emails?.unread || 0}
                subValue="Need attention"
                icon="📧"
                colorClass="text-purple-600"
              />
              <StatCard
                title="Pending Follow-ups"
                value={stats.followUps?.pending || 0}
                subValue="Scheduled"
                icon="💬"
                colorClass="text-orange-600"
              />
              <StatCard
                title="Total Revenue"
                value={formatCurrency(stats.invoices?.revenue || 0)}
                subValue="All time"
                icon="💰"
                colorClass="text-green-600"
              />
            </div>

            {/* Task Completion Chart */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Task Completion</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Completed</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {stats.tasks?.completed || 0} / {stats.tasks?.total || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-gray-900 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (stats.tasks?.total || 0) > 0
                            ? ((stats.tasks?.completed || 0) / (stats.tasks?.total || 1)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Pending</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.tasks?.pending || 0}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className="bg-gray-400 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          (stats.tasks?.total || 0) > 0
                            ? ((stats.tasks?.pending || 0) / (stats.tasks?.total || 1)) * 100
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-gray-500 text-lg font-medium mb-2">No data available</p>
            <p className="text-sm text-gray-400">Start using the platform to see your reports</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
