'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

export default function AgentsPage() {
  const [agents] = useState([
    {
      id: '1',
      name: 'Inbox Agent',
      description: 'Reads, sorts, classifies emails and extracts tasks automatically',
      status: 'active',
      lastRun: '2 minutes ago',
      capabilities: ['Email reading', 'Classification', 'Task extraction', 'Priority detection'],
    },
    {
      id: '2',
      name: 'Reply Agent',
      description: 'Writes professional customer replies matching your tone',
      status: 'active',
      lastRun: '5 minutes ago',
      capabilities: ['Reply generation', 'Tone matching', 'Context awareness'],
    },
    {
      id: '3',
      name: 'Follow-Up Agent',
      description: 'Sends automated follow-ups via WhatsApp and email',
      status: 'active',
      lastRun: '1 hour ago',
      capabilities: ['WhatsApp messaging', 'Email follow-ups', 'Auto-stop on reply'],
    },
    {
      id: '4',
      name: 'Proposal Agent',
      description: 'Creates professional proposals based on services and context',
      status: 'active',
      lastRun: 'Never',
      capabilities: ['Proposal generation', 'PDF creation', 'Auto-send'],
    },
    {
      id: '5',
      name: 'Invoice Agent',
      description: 'Creates invoices and tracks payment status',
      status: 'active',
      lastRun: 'Never',
      capabilities: ['Invoice generation', 'PDF creation', 'Payment tracking'],
    },
    {
      id: '6',
      name: 'Memory Agent',
      description: 'Learns your writing tone, preferences, and business context',
      status: 'active',
      lastRun: 'Continuous',
      capabilities: ['Tone learning', 'Context storage', 'Preference tracking'],
    },
  ])

  return (
    <DashboardLayout>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">AI Agents</h1>
          <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
            + Create Agent
          </button>
        </div>

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
      </div>
    </DashboardLayout>
  )
}

