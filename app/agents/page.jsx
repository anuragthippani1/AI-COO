'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents()
  }, [])

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/agents/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            + Create Agent
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading agents...</div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">No agents available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{agent.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    agent.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {agent.status}
                </span>
              </div>
              <p className="text-gray-600 mb-4">{agent.description}</p>
              {agent.capabilities && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">Capabilities:</p>
                  <div className="flex flex-wrap gap-1">
                    {agent.capabilities.map((cap, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="text-sm text-gray-500 mb-4">
                Last run: {agent.lastRun}
                {agent.activityCount > 0 && (
                  <span className="ml-2 text-green-600">
                    ({agent.activityCount} actions in last 24h)
                  </span>
                )}
              </div>
              <div className="flex space-x-2">
                <button className="flex-1 bg-primary-50 text-primary-600 px-4 py-2 rounded hover:bg-primary-100">
                  Configure
                </button>
                <button className="flex-1 bg-gray-50 text-gray-600 px-4 py-2 rounded hover:bg-gray-100">
                  View Logs
                </button>
              </div>
            </div>
          ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

