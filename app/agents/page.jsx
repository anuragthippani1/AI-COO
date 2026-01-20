'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { format } from 'date-fns'

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchAgents()
    // Refresh every 30 seconds
    const interval = setInterval(fetchAgents, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchAgents = async () => {
    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/agents/status', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch agents')
      }
    } catch (error) {
      console.error('Error fetching agents:', error)
      setError('Failed to fetch agents. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getAgentIcon = (name) => {
    const icons = {
      'Inbox Agent': '📧',
      'Reply Agent': '✍️',
      'Follow-Up Agent': '💬',
      'Task Agent': '✅',
      'Proposal Agent': '📄',
      'Invoice Agent': '💰',
      'Memory Agent': '🧠',
      'Scheduling Agent': '📅',
    }
    return icons[name] || '🤖'
  }

  const getStatusBadge = (status, activityCount) => {
    if (status === 'active') {
      if (activityCount > 0) {
        return (
          <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-medium rounded-full shadow-sm">
            Active • {activityCount} actions
          </span>
        )
      }
      return (
        <span className="px-2.5 py-1 bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">
          Active
        </span>
      )
    }
    return (
      <span className="px-2.5 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full border border-gray-200">
        Inactive
      </span>
    )
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">AI Agents</h1>
            <p className="text-gray-600 mt-1">
              {agents.length} agent{agents.length !== 1 ? 's' : ''} managing your operations
            </p>
          </div>
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 text-sm font-medium"
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

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-start">
            <p className="text-red-800 text-sm">{error}</p>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 ml-4">
              ×
            </button>
          </div>
        )}

        {/* Agents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">🤖</div>
            <p className="text-gray-500 mb-2 text-lg font-medium">No agents available</p>
            <p className="text-sm text-gray-400">
              Agents will appear here once they&apos;re configured
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-indigo-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => setSelectedAgent(agent)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl group-hover:scale-110 transition-transform duration-200">{getAgentIcon(agent.name)}</div>
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{agent.name}</h3>
                      {getStatusBadge(agent.status, agent.activityCount)}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {agent.description}
                </p>

                {agent.capabilities && agent.capabilities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Capabilities:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.capabilities.slice(0, 3).map((cap, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100 font-medium"
                        >
                          {cap}
                        </span>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <span className="text-xs text-gray-500 px-2.5 py-1">
                          +{agent.capabilities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    <div className="font-medium mb-1">Last Activity:</div>
                    <div>{agent.lastRun || 'Never'}</div>
                  </div>
                  {agent.activityCount > 0 && (
                    <div className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-full">
                      {agent.activityCount} actions
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Agent Detail Modal */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6 border-b border-gray-200 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{getAgentIcon(selectedAgent.name)}</div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {selectedAgent.name}
                      </h2>
                      {getStatusBadge(selectedAgent.status, selectedAgent.activityCount)}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600">{selectedAgent.description}</p>
                  </div>

                  {selectedAgent.capabilities && selectedAgent.capabilities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">Capabilities</h3>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedAgent.capabilities.map((cap, idx) => (
                          <div
                            key={idx}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700"
                          >
                            {cap}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Status</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedAgent.status === 'active' ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Last Activity</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedAgent.lastRun || 'Never'}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Activity (24h)</div>
                      <div className="text-sm font-medium text-gray-900">
                        {selectedAgent.activityCount || 0} actions
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="text-xs text-gray-500 mb-1">Agent ID</div>
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {selectedAgent.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        // Future: Configure agent
                        alert('Agent configuration coming soon!')
                      }}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-indigo-700 hover:to-violet-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
                    >
                      Configure
                    </button>
                    <button
                      onClick={() => {
                        // Future: View logs
                        alert('Agent logs coming soon!')
                      }}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
                    >
                      View Logs
                    </button>
                    <button
                      onClick={() => setSelectedAgent(null)}
                      className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
