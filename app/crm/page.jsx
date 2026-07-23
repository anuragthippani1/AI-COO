'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { format } from 'date-fns'

const stages = ['new', 'contacted', 'qualified', 'proposal_sent', 'negotiation', 'won', 'lost']

export default function CRMPage() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [view, setView] = useState('kanban') // kanban or list
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    stage: 'new',
    notes: '',
  })

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      // For now, using localStorage - you can create /api/crm/list endpoint
      const stored = localStorage.getItem('crm_leads')
      if (stored) {
        setLeads(JSON.parse(stored))
      } else {
        setLeads([])
      }
    } catch (error) {
      console.error('Error fetching leads:', error)
      setError('Failed to fetch leads. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLeads()
  }, [fetchLeads])

  const createLead = () => {
    if (!newLead.name.trim() || !newLead.email.trim()) {
      setError('Name and email are required')
      return
    }

    const lead = {
      id: Date.now().toString(),
      ...newLead,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
    }

    const updatedLeads = [...leads, lead]
    setLeads(updatedLeads)
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads))
    setSuccess('Lead created successfully!')
    setTimeout(() => setSuccess(''), 3000)
    setShowCreateModal(false)
    setNewLead({
      name: '',
      email: '',
      phone: '',
      company: '',
      stage: 'new',
      notes: '',
    })
  }

  const updateLeadStage = (leadId, newStage) => {
    const updatedLeads = leads.map((lead) =>
      lead.id === leadId
        ? { ...lead, stage: newStage, lastActivity: new Date().toISOString() }
        : lead
    )
    setLeads(updatedLeads)
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads))
  }

  const deleteLead = (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    const updatedLeads = leads.filter((lead) => lead.id !== leadId)
    setLeads(updatedLeads)
    localStorage.setItem('crm_leads', JSON.stringify(updatedLeads))
    setSuccess('Lead deleted successfully!')
    setTimeout(() => setSuccess(''), 3000)
  }

  const getLeadsByStage = (stage) => {
    return leads.filter((lead) => lead.stage === stage)
  }

  const getStageColor = (stage) => {
    const colors = {
      new: 'bg-blue-100 text-blue-700 border-blue-200',
      contacted: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      qualified: 'bg-cyan-100 text-cyan-700 border-cyan-200',
      proposal_sent: 'bg-orange-100 text-orange-700 border-orange-200',
      negotiation: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
      won: 'bg-green-100 text-green-700 border-green-200',
      lost: 'bg-red-100 text-red-700 border-red-200',
    }
    return colors[stage] || colors.new
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6" aria-busy={loading}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">CRM / Leads</h1>
            <p className="text-gray-600 mt-1">
              Manage your sales pipeline
              {leads.filter(l => l.source === 'email' || l.source === 'ai_detected').length > 0 && (
                <span className="ml-2 text-sm text-blue-600 font-medium">
                  • {leads.filter(l => l.source === 'email' || l.source === 'ai_detected').length} AI-detected
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView(view === 'kanban' ? 'list' : 'kanban')}
              aria-label={view === 'kanban' ? 'Switch to list view' : 'Switch to kanban view'}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
            >
              {view === 'kanban' ? '📋 List View' : '📊 Kanban View'}
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              aria-label="Add manual lead"
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all duration-200 flex items-center gap-2 text-sm font-medium"
              title="Most leads are detected automatically from emails"
            >
              <span>+</span> Manual Lead
            </button>
          </div>
        </div>

        {error && (
          <div
            className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-start gap-3"
            role="alert"
            aria-live="polite"
          >
            <p className="text-red-800 text-sm">{error}</p>
            <button
              type="button"
              onClick={() => setError('')}
              aria-label="Dismiss error"
              className="text-red-600 hover:text-red-800 ml-4 shrink-0"
            >
              ×
            </button>
          </div>
        )}

        {success && (
          <div
            className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm"
            role="status"
            aria-live="polite"
          >
            {success}
          </div>
        )}

        {loading ? (
          <div
            className="text-center py-12"
            role="status"
            aria-live="polite"
            aria-label="Loading leads"
          >
            <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4" aria-hidden />
            <p className="text-gray-500">Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">👥</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No leads yet</h2>
            <p className="text-sm text-gray-500 mb-4">
              Your AI COO will create leads automatically from your inbox and WhatsApp activity.
            </p>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              + Add manual lead
            </button>
          </div>
        ) : view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 overflow-x-auto">
            {stages.map((stage) => (
              <div key={stage} className="bg-white rounded-xl border border-gray-200 p-4 min-w-[200px]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 capitalize">{stage.replace('_', ' ')}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStageColor(stage)}`}>
                    {getLeadsByStage(stage).length}
                  </span>
                </div>
                <div className="space-y-2">
                  {getLeadsByStage(stage).length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6">No leads</p>
                  )}
                  {getLeadsByStage(stage).map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:border-blue-200 hover:shadow-sm transition-all duration-200"
                    >
                      <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{lead.name}</h4>
                      <p className="text-xs text-gray-500 mb-2 truncate">{lead.email}</p>
                      {lead.company && (
                        <p className="text-xs text-gray-400 mb-2 truncate">{lead.company}</p>
                      )}
                      {(lead.source === 'email' || lead.source === 'ai_detected') && (
                        <span className="inline-block text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 mb-2">
                          AI-detected
                        </span>
                      )}
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {stages.map((s) => (
                          <button
                            key={s}
                            onClick={() => updateLeadStage(lead.id, s)}
                            aria-label={`Move ${lead.name} to ${s.replace('_', ' ')}`}
                            className={`text-xs px-2 py-1 rounded transition-colors ${
                              lead.stage === s
                                ? 'bg-gray-900 text-white'
                                : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                            title={`Move to ${s}`}
                          >
                            {s.charAt(0).toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteLead(lead.id)}
                        aria-label={`Delete lead ${lead.name}`}
                        className="text-xs text-red-600 hover:text-red-800 mt-2"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Activity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center">
                      <div className="text-6xl mb-4">👥</div>
                      <p className="text-gray-500 mb-2 text-lg font-medium">No leads yet</p>
                      <p className="text-sm text-gray-400 mb-6">Create your first lead to get started</p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
                      >
                        Add Lead
                      </button>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lead.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.company || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border capitalize ${getStageColor(
                            lead.stage
                          )}`}
                        >
                          {lead.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lead.lastActivity
                          ? format(new Date(lead.lastActivity), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => deleteLead(lead.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create Lead Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">Add Lead</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                  <input
                    type="text"
                    value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                  <select
                    value={newLead.stage}
                    onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  >
                    {stages.map((stage) => (
                      <option key={stage} value={stage}>
                        {stage.charAt(0).toUpperCase() + stage.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newLead.notes}
                    onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={createLead}
                    className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Add Lead
                  </button>
                  <button
                    onClick={() => setShowCreateModal(false)}
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








