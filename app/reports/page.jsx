'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reports/daily', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        const summary = data.report?.summary || {}
        // Transform API response to match expected structure
        setStats({
          tasks: {
            total: (summary.tasks?.pending || 0) + (summary.tasks?.completed || 0),
            pending: summary.tasks?.pending || 0,
            completed: summary.tasks?.completed || 0,
          },
          emails: {
            total: summary.emails?.unread || 0, // API only returns unread
            unread: summary.emails?.unread || 0,
          },
          followUps: {
            pending: summary.followUps?.pending || 0,
          },
          invoices: {
            total: 0, // Not provided in daily report
            revenue: summary.revenue?.total || 0,
          },
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>

        {loading ? (
          <div className="text-center py-12">Loading reports...</div>
        ) : stats ? (
          <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tasks</h3>
                <p className="text-3xl font-bold">{stats.tasks?.total || 0}</p>
                <p className="text-sm text-gray-600 mt-2">
                  {stats.tasks?.completed || 0} completed
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Unread Emails</h3>
                <p className="text-3xl font-bold">{stats.emails.unread || 0}</p>
                <p className="text-sm text-gray-600 mt-2">
                  Need attention
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Follow-ups</h3>
                <p className="text-3xl font-bold">{stats.followUps?.pending || 0}</p>
                <p className="text-sm text-gray-600 mt-2">Pending</p>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
                <p className="text-3xl font-bold">{formatCurrency(stats.invoices?.revenue || 0)}</p>
                <p className="text-sm text-gray-600 mt-2">
                  All time
                </p>
              </div>
            </div>

            {/* Task Completion Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Task Completion</h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Completed</span>
                    <span className="text-sm font-medium">
                      {stats.tasks?.completed || 0} / {stats.tasks?.total || 0}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
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
                    <span className="text-sm text-gray-600">Pending</span>
                    <span className="text-sm font-medium">{stats.tasks?.pending || 0}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
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
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No data available</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

