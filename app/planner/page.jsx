'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/DashboardLayout'
import { format, startOfWeek, addDays, isSameDay } from 'date-fns'

export default function PlannerPage() {
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

  const fetchSchedule = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/business/weekly-schedule', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data = await response.json()
        setSchedule(data.schedule)
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to fetch schedule')
      }
    } catch (error) {
      console.error('Error fetching schedule:', error)
      setError('Failed to fetch schedule. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [weekStart])

  useEffect(() => {
    fetchSchedule()
  }, [fetchSchedule])

  const generateSchedule = async () => {
    try {
      setLoading(true)
      setError('')
      const token = localStorage.getItem('token')
      const response = await fetch('/api/business/weekly-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ weekStart: weekStart.toISOString() }),
      })

      if (response.ok) {
        const data = await response.json()
        setSchedule(data.schedule)
        setError('') // Clear any previous errors
      } else {
        const errorData = await response.json().catch(() => ({}))
        setError(errorData.error || 'Failed to generate schedule')
      }
    } catch (error) {
      console.error('Error generating schedule:', error)
      setError('Failed to generate schedule')
    } finally {
      setLoading(false)
    }
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const getTasksForDay = (day) => {
    if (!schedule?.tasks) return []
    return schedule.tasks.filter((task) => {
      const taskDate = new Date(task.dueDate || task.scheduledDate)
      return isSameDay(taskDate, day)
    })
  }

  const getMeetingsForDay = (day) => {
    if (!schedule?.meetings) return []
    return schedule.meetings.filter((meeting) => {
      const meetingDate = new Date(meeting.startTime)
      return isSameDay(meetingDate, day)
    })
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Weekly Planner</h1>
            <p className="text-gray-600 mt-1">
              {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')} • AI-generated schedule
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
            >
              ← Previous
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
            >
              This Week
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm font-medium"
            >
              Next →
            </button>
            <button
              onClick={generateSchedule}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white rounded-lg hover:from-blue-700 hover:via-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Generating...' : '🤖 Generate Schedule'}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        )}

        {loading && !schedule ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading schedule...</p>
          </div>
        ) : schedule ? (
          <div className="space-y-6">
            {/* AI Suggestions */}
            {schedule.suggestions && schedule.suggestions.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">🤖 AI Suggestions</h2>
                <ul className="space-y-2">
                  {schedule.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Weekly Grid */}
            <div className="flex items-center justify-end gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-50 border border-blue-300" />
                <span>Meetings</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-gray-50 border border-gray-300" />
                <span>Tasks</span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, index) => {
                const dayTasks = getTasksForDay(day)
                const dayMeetings = getMeetingsForDay(day)
                const isToday = isSameDay(day, new Date())

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-xl border p-4 transition-all duration-200 ${
                      isToday ? 'border-blue-400 shadow-md ring-1 ring-blue-100' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                        {format(day, 'EEE')}
                      </div>
                      <div
                        className={`text-lg font-bold ${
                          isToday ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {format(day, 'd')}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {dayMeetings.map((meeting, idx) => (
                        <div
                          key={idx}
                          className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 cursor-pointer"
                        >
                          <div className="font-medium text-blue-900">{meeting.title}</div>
                          <div className="text-blue-700">
                            {format(new Date(meeting.startTime), 'h:mm a')}
                          </div>
                        </div>
                      ))}

                      {dayTasks.map((task, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs hover:bg-gray-100 hover:border-gray-300 transition-all duration-200 cursor-pointer"
                        >
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.priority && (
                            <div className="text-gray-500 mt-1">
                              Priority: {task.priority}
                            </div>
                          )}
                        </div>
                      ))}

                      {dayTasks.length === 0 && dayMeetings.length === 0 && (
                        <div className="text-xs text-gray-400 text-center py-4">No items</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-sm">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-500 mb-2 text-lg font-medium">No schedule generated</p>
            <p className="text-sm text-gray-400 mb-6">Click &quot;Generate Schedule&quot; to create your weekly plan</p>
            <button
              onClick={generateSchedule}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:via-cyan-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {loading ? 'Generating...' : '🤖 Generate Schedule'}
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

