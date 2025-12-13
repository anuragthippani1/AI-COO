'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { format } from 'date-fns'

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState(null)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'email_received',
    actions: [{ type: 'send_email', payload: { to: '', subject: '', body: '' } }],
    isActive: true,
  })
  const [showTemplates, setShowTemplates] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetchWorkflows()
  }, [])

  const fetchWorkflows = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/workflows/list', {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data.workflows || [])
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch automations')
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
      setError('Failed to fetch automations. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const createWorkflow = async () => {
    if (!newWorkflow.name.trim()) {
      setError('Automation name is required')
      return
    }

    if (!newWorkflow.actions || newWorkflow.actions.length === 0) {
      setError('At least one action is required')
      return
    }

    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/workflows/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newWorkflow),
      })

      if (response.ok) {
        setSuccess('Automation created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setShowCreateModal(false)
        setNewWorkflow({
          name: '',
          description: '',
          trigger: 'email_received',
          actions: [{ type: 'send_email', payload: { to: '', subject: '', body: '' } }],
          isActive: true,
        })
        setShowTemplates(false)
        fetchWorkflows()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create automation')
      }
    } catch (error) {
      console.error('Error creating workflow:', error)
      setError('Failed to create automation')
    }
  }

  const updateWorkflow = async (workflowId, updates) => {
    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/workflows/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ id: workflowId, ...updates }),
      })

      if (response.ok) {
        setSuccess('Automation updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setEditingWorkflow(null)
        fetchWorkflows()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update automation')
      }
    } catch (error) {
      console.error('Error updating workflow:', error)
      setError('Failed to update automation')
    }
  }

  const handleDelete = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this automation?')) return
    
    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/workflows/delete?id=${workflowId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (response.ok) {
        setSuccess('Automation deleted successfully!')
        setTimeout(() => setSuccess(''), 3000)
        fetchWorkflows()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete automation')
      }
    } catch (error) {
      console.error('Error deleting workflow:', error)
      setError('Failed to delete automation')
    }
  }

  const handleToggle = async (workflow) => {
    try {
      await updateWorkflow(workflow.id, { isActive: !workflow.isActive })
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const handleTest = async (workflow) => {
    try {
      setError('')
      setSuccess('Testing automation...')
      const token = localStorage.getItem('token')
      
      let testTriggerData = {
        test: true,
        timestamp: new Date().toISOString(),
      }
      
      if (workflow.trigger === 'email_received') {
        testTriggerData = {
          ...testTriggerData,
          from: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email to trigger the automation',
          emailFrom: 'test@example.com',
          emailSubject: 'Test Email',
          emailContent: 'Test content',
        }
      } else if (workflow.trigger === 'task_overdue') {
        testTriggerData = {
          ...testTriggerData,
          taskId: 'test-task-id',
          title: 'Test Overdue Task',
          description: 'This is a test overdue task',
          priority: 'HIGH',
          dueDate: new Date().toISOString(),
          taskTitle: 'Test Overdue Task',
        }
      } else if (workflow.trigger === 'task_created') {
        testTriggerData = {
          ...testTriggerData,
          taskId: 'test-task-id',
          title: 'Test Task',
          priority: 'MEDIUM',
          dueDate: new Date().toISOString(),
        }
      }
      
      const response = await fetch('/api/workflows/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workflowId: workflow.id,
          triggerType: workflow.trigger,
          triggerData: testTriggerData,
        }),
      })
      
      if (response.ok) {
        setSuccess('Automation tested successfully! Check your Gmail Sent folder if it includes email action.')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to test automation')
      }
    } catch (error) {
      console.error('Error testing workflow:', error)
      setError('Failed to test automation: ' + error.message)
    }
  }

  const addAction = () => {
    setNewWorkflow({
      ...newWorkflow,
      actions: [...newWorkflow.actions, { type: 'send_email', payload: { to: '', subject: '', body: '' } }],
    })
  }

  const removeAction = (index) => {
    const newActions = newWorkflow.actions.filter((_, i) => i !== index)
    setNewWorkflow({ ...newWorkflow, actions: newActions })
  }

  const updateAction = (index, field, value) => {
    const newActions = [...newWorkflow.actions]
    if (field === 'type') {
      newActions[index] = { type: value, payload: { to: '', subject: '', body: '' } }
    } else if (field.startsWith('payload.')) {
      const payloadField = field.substring(8)
      newActions[index].payload = { ...newActions[index].payload, [payloadField]: value }
    }
    setNewWorkflow({ ...newWorkflow, actions: newActions })
  }

  const triggerOptions = [
    { value: 'email_received', label: 'Email Received' },
    { value: 'task_created', label: 'Task Created' },
    { value: 'task_overdue', label: 'Task Overdue' },
    { value: 'lead_stage_change', label: 'Lead Stage Change' },
    { value: 'calendar_event', label: 'Calendar Event' },
  ]

  const actionTypes = [
    { value: 'create_task', label: 'Create Task' },
    { value: 'send_email', label: 'Send Email' },
    { value: 'schedule_followup', label: 'Schedule Follow-up' },
    { value: 'generate_proposal', label: 'Generate Proposal' },
    { value: 'run_agent', label: 'Run AI Agent' },
    { value: 'update_crm_lead', label: 'Update CRM Lead' },
  ]

  const workflowTemplates = [
    {
      name: 'Email to Task',
      description: 'Automatically create tasks from emails',
      trigger: 'email_received',
      actions: [{ type: 'run_agent', payload: { type: 'email' } }],
    },
    {
      name: 'Task Reminder',
      description: 'Send follow-up for overdue tasks',
      trigger: 'task_overdue',
      actions: [{ type: 'send_email', payload: { to: '{{emailFrom}}', subject: 'Task Reminder: {{taskTitle}}', body: 'Your task "{{taskTitle}}" is overdue.' } }],
    },
    {
      name: 'Auto Reply',
      description: 'Automatically reply to emails',
      trigger: 'email_received',
      actions: [{ type: 'run_agent', payload: { type: 'email', action: 'reply' } }],
    },
  ]

  const useTemplate = (template) => {
    setNewWorkflow({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      actions: template.actions,
      isActive: true,
    })
    setShowTemplates(false)
  }

  const getTriggerDescription = (trigger) => {
    const descriptions = {
      'email_received': 'Triggers automatically when you receive a new email',
      'task_created': 'Triggers automatically when a new task is created',
      'task_overdue': 'Triggers automatically when a task becomes overdue (checked daily at 9 AM)',
      'lead_stage_change': 'Triggers automatically when a lead stage changes',
      'calendar_event': 'Triggers automatically when a calendar event occurs',
    }
    return descriptions[trigger] || `Triggers when: ${trigger} event occurs`
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Automations</h1>
            <p className="text-gray-600 mt-1">
              {workflows.length} automation{workflows.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
          >
            <span>+</span> Create Automation
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-start">
            <p className="text-red-800 text-sm">{error}</p>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 ml-4">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between items-start">
            <p className="text-green-800 text-sm">{success}</p>
            <button onClick={() => setSuccess('')} className="text-green-600 hover:text-green-800 ml-4">
              ×
            </button>
          </div>
        )}

        {/* Automation List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : workflows.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">⚙️</div>
            <p className="text-gray-500 mb-2 text-lg font-medium">No automations yet</p>
            <p className="text-sm text-gray-400 mb-6">
              Create your first automation to automate your workflow
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Create Automation
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          workflow.isActive
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {workflow.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{workflow.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div>
                    <span className="text-gray-500 font-medium">Trigger:</span>
                    <span className="ml-2 text-gray-900">
                      {triggerOptions.find(t => t.value === workflow.trigger)?.label || workflow.trigger}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 font-medium">Actions:</span>
                    <span className="ml-2 text-gray-900">
                      {Array.isArray(workflow.actions)
                        ? workflow.actions.map((a) => actionTypes.find(act => act.value === a.type)?.label || a.type).join(', ')
                        : 'N/A'}
                    </span>
                  </div>
                  {workflow.createdAt && (
                    <div className="text-xs text-gray-400">
                      Created: {format(new Date(workflow.createdAt), 'MMM dd, yyyy')}
                    </div>
                  )}
                </div>

                {workflow.isActive && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 font-medium mb-1">When will it run?</p>
                    <p className="text-xs text-gray-500">
                      {getTriggerDescription(workflow.trigger)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleTest(workflow)}
                    className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Test this automation"
                  >
                    Test
                  </button>
                  <button
                    onClick={() => handleToggle(workflow)}
                    className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      workflow.isActive
                        ? 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    }`}
                  >
                    {workflow.isActive ? 'Disable' : 'Enable'}
                  </button>
                  <button
                    onClick={() => setEditingWorkflow(workflow)}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Edit automation"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(workflow.id)}
                    className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Delete automation"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Automation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Automation</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewWorkflow({
                      name: '',
                      description: '',
                      trigger: 'email_received',
                      actions: [{ type: 'send_email', payload: { to: '', subject: '', body: '' } }],
                      isActive: true,
                    })
                    setShowTemplates(false)
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {!showTemplates && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      📋 Use Template
                    </button>
                  </div>
                )}

                {showTemplates && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-900">Choose a Template</h3>
                      <button
                        onClick={() => setShowTemplates(false)}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-2">
                      {workflowTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => useTemplate(template)}
                          className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors"
                        >
                          <div className="font-medium text-gray-900">{template.name}</div>
                          <div className="text-sm text-gray-600">{template.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={newWorkflow.name}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="e.g., Auto-create tasks from emails"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newWorkflow.description}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Describe what this automation does"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger *
                  </label>
                  <select
                    value={newWorkflow.trigger}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, trigger: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {triggerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Actions *
                    </label>
                    <button
                      onClick={addAction}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      + Add Action
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newWorkflow.actions.map((action, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex gap-2 items-center mb-3">
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(index, 'type', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                          >
                            {actionTypes.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          {newWorkflow.actions.length > 1 && (
                            <button
                              onClick={() => removeAction(index)}
                              className="px-3 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-white text-sm"
                              title="Remove action"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {action.type === 'send_email' && (
                          <div className="space-y-2 pl-4 border-l-2 border-gray-300">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">To Email *</label>
                              <input
                                type="email"
                                placeholder="recipient@example.com or {{emailFrom}}"
                                value={action.payload?.to || ''}
                                onChange={(e) => updateAction(index, 'payload.to', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Use variables: {'{{emailFrom}}'} for sender email
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Subject *</label>
                              <input
                                type="text"
                                placeholder="Email subject or {{emailSubject}}"
                                value={action.payload?.subject || ''}
                                onChange={(e) => updateAction(index, 'payload.subject', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Body *</label>
                              <textarea
                                placeholder="Email body or {{emailContent}}"
                                value={action.payload?.body || ''}
                                onChange={(e) => updateAction(index, 'payload.body', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                                rows={3}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Variables: {'{{emailContent}}'}, {'{{taskTitle}}'}, {'{{contactName}}'}
                              </p>
                            </div>
                          </div>
                        )}

                        {action.type === 'create_task' && (
                          <div className="space-y-2 pl-4 border-l-2 border-gray-300">
                            <input
                              type="text"
                              placeholder="Task title"
                              value={action.payload?.title || ''}
                              onChange={(e) => updateAction(index, 'payload.title', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                            <select
                              value={action.payload?.priority || 'MEDIUM'}
                              onChange={(e) => updateAction(index, 'payload.priority', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            >
                              <option value="LOW">Low Priority</option>
                              <option value="MEDIUM">Medium Priority</option>
                              <option value="HIGH">High Priority</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center pt-4 border-t border-gray-200">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={newWorkflow.isActive}
                    onChange={(e) => setNewWorkflow({ ...newWorkflow, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Activate immediately
                  </label>
                </div>

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={createWorkflow}
                    className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Create Automation
                  </button>
                  <button
                    onClick={() => {
                      setShowCreateModal(false)
                      setNewWorkflow({
                        name: '',
                        description: '',
                        trigger: 'email_received',
                        actions: [{ type: 'send_email', payload: { to: '', subject: '', body: '' } }],
                        isActive: true,
                      })
                      setShowTemplates(false)
                    }}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Automation Modal */}
        {editingWorkflow && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">Edit Automation</h2>
                <button
                  onClick={() => setEditingWorkflow(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingWorkflow.name}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingWorkflow.description || ''}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trigger *
                  </label>
                  <select
                    value={editingWorkflow.trigger}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, trigger: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {triggerOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingWorkflow.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, isActive: e.target.value === 'active' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => updateWorkflow(editingWorkflow.id, {
                      name: editingWorkflow.name,
                      description: editingWorkflow.description,
                      trigger: editingWorkflow.trigger,
                      isActive: editingWorkflow.isActive,
                    })}
                    className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingWorkflow(null)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
