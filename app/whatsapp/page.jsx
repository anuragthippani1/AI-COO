'use client'

import { useState, useEffect, useRef } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { format } from 'date-fns'

export default function WhatsAppPage() {
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isConfigured, setIsConfigured] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    checkConfiguration()
    loadConversations()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkConfiguration = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/settings/integrations', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setIsConfigured(data.integrations?.whatsapp?.configured || false)
      }
    } catch (error) {
      console.error('Error checking configuration:', error)
    }
  }

  const loadConversations = () => {
    // Load conversations from localStorage (you can replace with API call)
    const stored = localStorage.getItem('whatsapp_conversations')
    if (stored) {
      const convs = JSON.parse(stored)
      setConversations(convs)
      if (convs.length > 0 && !selectedConversation) {
        setSelectedConversation(convs[0])
        loadMessages(convs[0].phoneNumber)
      }
    }
  }

  const loadMessages = (phone) => {
    // Load messages from localStorage (you can replace with API call)
    const stored = localStorage.getItem(`whatsapp_messages_${phone}`)
    if (stored) {
      setMessages(JSON.parse(stored))
    } else {
      setMessages([])
    }
  }

  const saveConversation = (phone, name) => {
    const conv = {
      id: phone,
      phoneNumber: phone,
      name: name || phone,
      lastMessage: newMessage,
      lastMessageTime: new Date().toISOString(),
    }

    const existing = conversations.find((c) => c.phoneNumber === phone)
    if (existing) {
      const updated = conversations.map((c) =>
        c.phoneNumber === phone ? { ...c, ...conv } : c
      )
      setConversations(updated)
      localStorage.setItem('whatsapp_conversations', JSON.stringify(updated))
    } else {
      const updated = [conv, ...conversations]
      setConversations(updated)
      localStorage.setItem('whatsapp_conversations', JSON.stringify(updated))
    }
  }

  const saveMessage = (phone, message, sent = true) => {
    const messageObj = {
      id: Date.now().toString(),
      phoneNumber: phone,
      message,
      sent,
      timestamp: new Date().toISOString(),
    }

    const stored = localStorage.getItem(`whatsapp_messages_${phone}`)
    const existingMessages = stored ? JSON.parse(stored) : []
    const updatedMessages = [...existingMessages, messageObj]
    localStorage.setItem(`whatsapp_messages_${phone}`, JSON.stringify(updatedMessages))
    setMessages(updatedMessages)
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !phoneNumber.trim()) {
      setError('Please enter a phone number and message')
      return
    }

    if (!isConfigured) {
      setError('WhatsApp is not configured. Please add WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID to your .env file')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const token = localStorage.getItem('token')
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phoneNumber,
          message: newMessage,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Message sent successfully!')
        setTimeout(() => setSuccess(''), 3000)

        // Save conversation and message
        saveConversation(phoneNumber)
        saveMessage(phoneNumber, newMessage, true)

        // Update selected conversation
        if (!selectedConversation || selectedConversation.phoneNumber !== phoneNumber) {
          const conv = conversations.find((c) => c.phoneNumber === phoneNumber) || {
            id: phoneNumber,
            phoneNumber,
            name: phoneNumber,
            lastMessage: newMessage,
            lastMessageTime: new Date().toISOString(),
          }
          setSelectedConversation(conv)
          loadMessages(phoneNumber)
        }

        setNewMessage('')
      } else {
        setError(data.error || 'Failed to send message')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      setError('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectConversation = (conversation) => {
    setSelectedConversation(conversation)
    loadMessages(conversation.phoneNumber)
    setPhoneNumber(conversation.phoneNumber)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6 h-[calc(100vh-120px)] flex flex-col">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">WhatsApp Messages</h1>
          <p className="text-gray-600 mt-1">Send and manage WhatsApp messages</p>
        </div>

        {!isConfigured && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              <strong>WhatsApp not configured:</strong> Please add{' '}
              <code className="bg-yellow-100 px-1 rounded">WHATSAPP_ACCESS_TOKEN</code> and{' '}
              <code className="bg-yellow-100 px-1 rounded">WHATSAPP_PHONE_NUMBER_ID</code> to your{' '}
              <code className="bg-yellow-100 px-1 rounded">.env</code> file. See Settings → Integrations for details.
            </p>
          </div>
        )}

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

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
          {/* Conversations List */}
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Conversations</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No conversations yet
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => selectConversation(conv)}
                      className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                        selectedConversation?.phoneNumber === conv.phoneNumber
                          ? 'bg-gray-100 border-l-4 border-gray-900'
                          : ''
                      }`}
                    >
                      <div className="font-medium text-gray-900">{conv.name}</div>
                      <div className="text-sm text-gray-500 mt-1">{conv.phoneNumber}</div>
                      {conv.lastMessage && (
                        <div className="text-xs text-gray-400 mt-1 truncate">
                          {conv.lastMessage}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {selectedConversation?.name || 'New Message'}
                  </h2>
                  {selectedConversation && (
                    <p className="text-sm text-gray-500">{selectedConversation.phoneNumber}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedConversation ? (
                messages.length === 0 ? (
                  <div className="text-center text-gray-500 text-sm py-8">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sent ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          msg.sent
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.message}</p>
                        <p
                          className={`text-xs mt-1 ${
                            msg.sent ? 'text-gray-300' : 'text-gray-500'
                          }`}
                        >
                          {format(new Date(msg.timestamp), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div className="text-center text-gray-500 text-sm py-8">
                  Select a conversation or enter a phone number to start messaging
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number (with country code, e.g., +1234567890)
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
                />
              </div>
              <div className="flex gap-2">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  rows={2}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm resize-none"
                />
                <button
                  onClick={sendMessage}
                  disabled={loading || !newMessage.trim() || !phoneNumber.trim()}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}







