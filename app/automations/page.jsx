'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState(null)
  const [newWorkflow, setNewWorkflow] = useState({
    name: '',
    description: '',
    trigger: 'email_received',
    actions: [{ type: 'create_task', payload: { title: 'Task from email', priority: 'MEDIUM' } }],
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
          actions: [{ type: 'create_task', payload: { title: 'Task from email', priority: 'MEDIUM' } }],
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

  const addAction = () => {
    setNewWorkflow({
      ...newWorkflow,
      actions: [...newWorkflow.actions, { type: 'create_task', payload: {} }],
    })
  }

  const removeAction = (index) => {
    const newActions = newWorkflow.actions.filter((_, i) => i !== index)
    setNewWorkflow({ ...newWorkflow, actions: newActions })
  }

  const updateAction = (index, field, value) => {
    const newActions = [...newWorkflow.actions]
    if (field === 'type') {
      newActions[index] = { type: value, payload: {} }
    } else {
      newActions[index] = { ...newActions[index], [field]: value }
    }
    setNewWorkflow({ ...newWorkflow, actions: newActions })
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
      actions: [{ type: 'send_email', payload: { subject: 'Task Reminder', body: 'Your task is overdue' } }],
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

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Automations</h1>
            <p className="text-sm text-gray-500 mt-1">
              {workflows.length} automation{workflows.length !== 1 ? 's' : ''} configured
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <span>+</span> Create Automation
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
            <button onClick={() => setError('')} className="ml-4 text-red-600">×</button>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
            <button onClick={() => setSuccess('')} className="ml-4 text-green-600">×</button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">Loading automations...</div>
        ) : automations.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 mb-4">No automations yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Create your first automation to automate your workflow
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Create Automation
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {automations.map((automation) => (
              <div key={automation.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{automation.name}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          automation.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {automation.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    {automation.workflow.description && (
                      <p className="text-sm text-gray-600 mb-3">{automation.workflow.description}</p>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Trigger:</span>
                        <span className="ml-2 text-gray-600">
                          {triggerOptions.find(t => t.value === automation.trigger)?.label || automation.trigger}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Actions:</span>
                        <span className="ml-2 text-gray-600">{automation.action}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      {automation.workflow.createdAt && (
                        <span>Created: {new Date(automation.workflow.createdAt).toLocaleDateString()}</span>
                      )}
                      <span className={`px-2 py-0.5 rounded ${
                        automation.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {automation.status === 'active' ? '✓ Ready to execute' : '⏸ Paused'}
                      </span>
                    </div>
                    {automation.status === 'active' && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>When will it run?</strong>
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          {automation.trigger === 'email_received' && 'Triggers automatically when you receive a new email'}
                          {automation.trigger === 'task_created' && 'Triggers automatically when a new task is created'}
                          {automation.trigger === 'task_overdue' && 'Triggers automatically when a task becomes overdue (checked daily at 9 AM)'}
                          {automation.trigger === 'lead_stage_change' && 'Triggers automatically when a lead stage changes'}
                          {automation.trigger === 'calendar_event' && 'Triggers automatically when a calendar event occurs'}
                          {!['email_received', 'task_created', 'task_overdue', 'lead_stage_change', 'calendar_event'].includes(automation.trigger) && `Triggers when: ${automation.trigger} event occurs`}
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          💡 Click "Test" button to test it now without waiting for the trigger
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token')
                          setSuccess('Testing automation...')
                          
                          // Prepare test data based on trigger type
                          let testTriggerData = {
                            test: true,
                            timestamp: new Date().toISOString(),
                          }
                          
                          if (automation.workflow.trigger === 'email_received') {
                            testTriggerData = {
                              ...testTriggerData,
                              from: 'test@example.com',
                              subject: 'Test Email',
                              body: 'This is a test email to trigger the automation',
                              emailFrom: 'test@example.com',
                              emailSubject: 'Test Email',
                              emailContent: 'Test content',
                            }
                          } else if (automation.workflow.trigger === 'task_overdue') {
                            testTriggerData = {
                              ...testTriggerData,
                              taskId: 'test-task-id',
                              title: 'Test Overdue Task',
                              description: 'This is a test overdue task',
                              priority: 'HIGH',
                              dueDate: new Date().toISOString(),
                              taskTitle: 'Test Overdue Task',
                            }
                          } else if (automation.workflow.trigger === 'task_created') {
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
                              workflowId: automation.workflow.id,
                              triggerType: automation.workflow.trigger,
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
                      }}
                      className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
                      title="Test this automation now"
                    >
                      🧪 Test
                    </button>
                    <button
                      onClick={() => handleToggle(automation.workflow)}
                      className={`px-3 py-1 text-sm rounded ${
                        automation.status === 'active'
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {automation.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      onClick={() => setEditingWorkflow(automation.workflow)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(automation.workflow.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Automation Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Create Automation</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewWorkflow({
                      name: '',
                      description: '',
                      trigger: 'email_received',
                      actions: [{ type: 'create_task', payload: {} }],
                      isActive: true,
                    })
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {!showTemplates && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowTemplates(true)}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      📋 Use Template
                    </button>
                  </div>
                )}

                {showTemplates && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium">Choose a Template</h3>
                      <button
                        onClick={() => setShowTemplates(false)}
                        className="text-sm text-gray-600 hover:text-gray-800"
                      >
                        ×
                      </button>
                    </div>
                    <div className="space-y-2">
                      {workflowTemplates.map((template, idx) => (
                        <button
                          key={idx}
                          onClick={() => useTemplate(template)}
                          className="w-full text-left p-3 bg-white border border-gray-200 rounded hover:bg-gray-50"
                        >
                          <div className="font-medium">{template.name}</div>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      + Add Action
                    </button>
                  </div>
                  <div className="space-y-2">
                    {newWorkflow.actions.map((action, index) => (
                      <div key={index} className="p-3 border border-gray-200 rounded-lg space-y-2">
                        <div className="flex gap-2 items-center">
                          <select
                            value={action.type}
                            onChange={(e) => updateAction(index, 'type', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                              className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-200 rounded hover:bg-red-50"
                              title="Remove action"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {action.type === 'create_task' && (
                          <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                            <input
                              type="text"
                              placeholder="Task title"
                              value={action.payload?.title || ''}
                              onChange={(e) => {
                                const newActions = [...newWorkflow.actions]
                                newActions[index] = {
                                  ...newActions[index],
                                  payload: { ...newActions[index].payload, title: e.target.value },
                                }
                                setNewWorkflow({ ...newWorkflow, actions: newActions })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                            />
                            <select
                              value={action.payload?.priority || 'MEDIUM'}
                              onChange={(e) => {
                                const newActions = [...newWorkflow.actions]
                                newActions[index] = {
                                  ...newActions[index],
                                  payload: { ...newActions[index].payload, priority: e.target.value },
                                }
                                setNewWorkflow({ ...newWorkflow, actions: newActions })
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                            >
                              <option value="LOW">Low Priority</option>
                              <option value="MEDIUM">Medium Priority</option>
                              <option value="HIGH">High Priority</option>
                              <option value="URGENT">Urgent</option>
                            </select>
                          </div>
                        )}
                        {action.type === 'send_email' && (
                          <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">To Email *</label>
                              <input
                                type="email"
                                placeholder="recipient@example.com or {{emailFrom}}"
                                value={action.payload?.to || ''}
                                onChange={(e) => {
                                  const newActions = [...newWorkflow.actions]
                                  newActions[index] = {
                                    ...newActions[index],
                                    payload: { ...newActions[index].payload, to: e.target.value },
                                  }
                                  setNewWorkflow({ ...newWorkflow, actions: newActions })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
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
                                onChange={(e) => {
                                  const newActions = [...newWorkflow.actions]
                                  newActions[index] = {
                                    ...newActions[index],
                                    payload: { ...newActions[index].payload, subject: e.target.value },
                                  }
                                  setNewWorkflow({ ...newWorkflow, actions: newActions })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Body *</label>
                              <textarea
                                placeholder="Email body or {{emailContent}}"
                                value={action.payload?.body || ''}
                                onChange={(e) => {
                                  const newActions = [...newWorkflow.actions]
                                  newActions[index] = {
                                    ...newActions[index],
                                    payload: { ...newActions[index].payload, body: e.target.value },
                                  }
                                  setNewWorkflow({ ...newWorkflow, actions: newActions })
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 text-sm"
                                rows={3}
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                Variables: {'{{emailContent}}'}, {'{{taskTitle}}'}, {'{{contactName}}'}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center">
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
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={createWorkflow}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
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
                        actions: [{ type: 'create_task', payload: {} }],
                        isActive: true,
                      })
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
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
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Automation</h2>
                <button
                  onClick={() => setEditingWorkflow(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={editingWorkflow.name}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingWorkflow.description || ''}
                    onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  <button
                    onClick={() => updateWorkflow(editingWorkflow.id, {
                      name: editingWorkflow.name,
                      description: editingWorkflow.description,
                      trigger: editingWorkflow.trigger,
                      isActive: editingWorkflow.isActive,
                    })}
                    className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingWorkflow(null)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
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

