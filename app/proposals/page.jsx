'use client'

import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { format } from 'date-fns'

export default function ProposalsPage() {
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newProposal, setNewProposal] = useState({
    clientName: '',
    clientEmail: '',
    projectTitle: '',
    description: '',
    items: [{ description: '', quantity: 1, price: 0 }],
    total: 0,
    validUntil: '',
  })

  useEffect(() => {
    fetchProposals()
  }, [])

  const fetchProposals = async () => {
    try {
      setLoading(true)
      setError('')
      // For now, we'll store proposals in localStorage or create an API endpoint
      // This is a placeholder - you may need to create /api/proposals/list
      const token = localStorage.getItem('token')
      // Simulated fetch - replace with actual API call when endpoint exists
      setProposals([])
    } catch (error) {
      console.error('Error fetching proposals:', error)
      setError('Failed to fetch proposals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const createProposal = async () => {
    if (!newProposal.clientName.trim() || !newProposal.projectTitle.trim()) {
      setError('Client name and project title are required')
      return
    }

    try {
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/proposal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newProposal),
      })

      if (response.ok) {
        setSuccess('Proposal created successfully!')
        setTimeout(() => setSuccess(''), 3000)
        setShowCreateModal(false)
        setNewProposal({
          clientName: '',
          clientEmail: '',
          projectTitle: '',
          description: '',
          items: [{ description: '', quantity: 1, price: 0 }],
          total: 0,
          validUntil: '',
        })
        fetchProposals()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create proposal')
      }
    } catch (error) {
      console.error('Error creating proposal:', error)
      setError('Failed to create proposal')
    }
  }

  const addItem = () => {
    setNewProposal({
      ...newProposal,
      items: [...newProposal.items, { description: '', quantity: 1, price: 0 }],
    })
  }

  const removeItem = (index) => {
    const newItems = newProposal.items.filter((_, i) => i !== index)
    setNewProposal({ ...newProposal, items: newItems })
  }

  const updateItem = (index, field, value) => {
    const newItems = [...newProposal.items]
    newItems[index] = { ...newItems[index], [field]: value }
    const total = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    setNewProposal({ ...newProposal, items: newItems, total })
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-600 mt-1">Create and manage client proposals</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2 text-sm"
          >
            <span>+</span> Create Proposal
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex justify-between items-start">
            <p className="text-red-800 text-sm">{error}</p>
            <button onClick={() => setError('')} className="text-red-600 hover:text-red-800 ml-4">
              ×
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
            {success}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : proposals.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-500 mb-2 text-lg font-medium">No proposals yet</p>
            <p className="text-sm text-gray-400 mb-6">Create your first proposal to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors text-sm"
            >
              Create Proposal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 transition-colors"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{proposal.projectTitle}</h3>
                <p className="text-sm text-gray-500 mb-4">{proposal.clientName}</p>
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <span className="text-sm font-semibold text-gray-900">
                    ${proposal.total?.toFixed(2) || '0.00'}
                  </span>
                  <button className="text-sm text-gray-600 hover:text-gray-900">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Proposal Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
                <h2 className="text-xl font-bold text-gray-900">Create Proposal</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={newProposal.clientName}
                    onChange={(e) => setNewProposal({ ...newProposal, clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Client name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Email
                  </label>
                  <input
                    type="email"
                    value={newProposal.clientEmail}
                    onChange={(e) => setNewProposal({ ...newProposal, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="client@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Title *
                  </label>
                  <input
                    type="text"
                    value={newProposal.projectTitle}
                    onChange={(e) => setNewProposal({ ...newProposal, projectTitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    placeholder="Project title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                    rows={3}
                    placeholder="Project description"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Items *</label>
                    <button
                      onClick={addItem}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newProposal.items.map((item, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Description"
                            value={item.description}
                            onChange={(e) => updateItem(index, 'description', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Qty"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                            <input
                              type="number"
                              placeholder="Price"
                              value={item.price}
                              onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                            />
                          </div>
                        </div>
                        {newProposal.items.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Total: <span className="font-semibold">${newProposal.total.toFixed(2)}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={newProposal.validUntil}
                    onChange={(e) => setNewProposal({ ...newProposal, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={createProposal}
                    className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Create Proposal
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








