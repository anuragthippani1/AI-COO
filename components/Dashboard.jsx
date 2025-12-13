'use client'

import { useEffect, useState } from 'react'
import { formatDate, formatCurrency } from '@/lib/utils'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
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

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (!data) {
    return <div className="p-8">Error loading dashboard</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Tasks</h3>
          <p className="text-3xl font-bold">{data.stats?.tasks?.total || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            {data.stats?.tasks?.pending || 0} pending
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Unread Emails</h3>
          <p className="text-3xl font-bold">{data.stats?.emails?.unread || 0}</p>
          <p className="text-sm text-gray-600 mt-2">
            {data.stats?.emails?.total || 0} total
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Pending Follow-ups</h3>
          <p className="text-3xl font-bold">{data.stats?.followUps?.pending || 0}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Revenue</h3>
          <p className="text-3xl font-bold">{formatCurrency(data.stats?.invoices?.revenue || 0)}</p>
          <p className="text-sm text-gray-600 mt-2">
            {data.stats?.invoices?.total || 0} invoices
          </p>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Recent Tasks</h2>
        </div>
        <div className="p-6">
          {!data.recentTasks || data.recentTasks.length === 0 ? (
            <p className="text-gray-500">No tasks yet</p>
          ) : (
            <div className="space-y-4">
              {data.recentTasks.map((task) => (
                <div key={task.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-500">
                      {task.priority} • {task.status}
                    </p>
                  </div>
                  {task.dueDate && (
                    <span className="text-sm text-gray-500">
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Follow-ups */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Upcoming Follow-ups</h2>
        </div>
        <div className="p-6">
          {!data.upcomingFollowUps || data.upcomingFollowUps.length === 0 ? (
            <p className="text-gray-500">No follow-ups scheduled</p>
          ) : (
            <div className="space-y-4">
              {data.upcomingFollowUps.map((followUp) => (
                <div key={followUp.id} className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">{followUp.leadName}</h3>
                    <p className="text-sm text-gray-500">{followUp.channel}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(followUp.scheduledFor)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

