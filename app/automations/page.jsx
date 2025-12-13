'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/workflows/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflows/delete?id=${workflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      alert('Failed to delete automation')
    }
  }

  const handleToggle = async (workflow) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/workflows/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: workflow.id,
          isActive: !workflow.isActive,
        }),
      })
      
      if (response.ok) {
        fetchWorkflows()
      }
    } catch (error) {
      console.error('Error updating workflow:', error)
      alert('Failed to update automation')
    }
  }

  const automations = workflows.map((w) => ({
    id: w.id,
    name: w.name,
    trigger: w.trigger,
    action: Array.isArray(w.actions) 
      ? w.actions.map((a) => a.type).join(', ')
      : 'Multiple actions',
    status: w.isActive ? 'active' : 'inactive',
    workflow: w,
  }))

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Automations</h1>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            + Create Automation
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">Loading automations...</div>
        ) : automations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No automations yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Create your first automation to automate your workflow
            </p>
            <button
              onClick={() => {
                alert('Create automation feature coming soon!')
              }}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Create Automation
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigger
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {automations.map((automation) => (
                  <tr key={automation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {automation.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{automation.trigger}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{automation.action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          automation.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {automation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleToggle(automation.workflow)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        {automation.status === 'active' ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleDelete(automation.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

