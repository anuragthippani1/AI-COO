'use client'

import { useState, useMemo } from 'react'
import { format, isToday, isYesterday, isThisWeek, startOfDay, subDays } from 'date-fns'
import ActivityItem from './ActivityItem'

/**
 * Professional Activity Timeline Component
 * Groups activities by time periods and provides filtering
 */

const TIME_GROUPS = {
  today: 'Today',
  yesterday: 'Yesterday',
  thisWeek: 'This Week',
  older: 'Older',
}

function groupByTime(logs) {
  const groups = {
    today: [],
    yesterday: [],
    thisWeek: [],
    older: [],
  }

  logs.forEach((log) => {
    const date = new Date(log.createdAt || log.timestamp)
    
    if (isToday(date)) {
      groups.today.push(log)
    } else if (isYesterday(date)) {
      groups.yesterday.push(log)
    } else if (isThisWeek(date)) {
      groups.thisWeek.push(log)
    } else {
      groups.older.push(log)
    }
  })

  return groups
}

function filterLogs(logs, filter) {
  if (filter === 'all') return logs
  
  if (filter === 'handled') {
    return logs.filter(log => 
      log.status === 'completed' || 
      log.status === 'success' || 
      log.status === 'executed'
    )
  }
  
  if (filter === 'needs_approval') {
    return logs.filter(log => 
      log.status === 'pending_approval' || 
      log.status === 'requires_approval'
    )
  }
  
  if (filter === 'risks') {
    return logs.filter(log => 
      log.riskLevel === 'high' || 
      log.status === 'failed' || 
      log.status === 'blocked_by_safety'
    )
  }
  
  return logs
}

export default function ActivityTimeline({ 
  logs = [], 
  loading = false, 
  onApprove, 
  onRollback,
  onRefresh 
}) {
  const [timeFilter, setTimeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = filterLogs(logs, statusFilter)
    
    if (timeFilter !== 'all') {
      const grouped = groupByTime(result)
      result = grouped[timeFilter] || []
    }
    
    return result
  }, [logs, statusFilter, timeFilter])

  // Group filtered logs by time
  const groupedLogs = useMemo(() => {
    if (timeFilter !== 'all') {
      return { [timeFilter]: filteredLogs }
    }
    return groupByTime(filteredLogs)
  }, [filteredLogs, timeFilter])

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (filteredLogs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No activity yet
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Your AI COO hasn&apos;t taken any actions yet. Connect your Gmail account to start automation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              statusFilter === 'all'
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('handled')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              statusFilter === 'handled'
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Handled by AI
          </button>
          <button
            onClick={() => setStatusFilter('needs_approval')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              statusFilter === 'needs_approval'
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Needs Approval
          </button>
          <button
            onClick={() => setStatusFilter('risks')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              statusFilter === 'risks'
                ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Risks / Alerts
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              timeFilter === 'all'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setTimeFilter('today')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              timeFilter === 'today'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeFilter('yesterday')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              timeFilter === 'yesterday'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            Yesterday
          </button>
          <button
            onClick={() => setTimeFilter('thisWeek')}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all duration-200 ${
              timeFilter === 'thisWeek'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            This Week
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-100">
          {Object.entries(groupedLogs).map(([groupKey, groupLogs]) => {
            if (groupLogs.length === 0) return null
            
            return (
              <div key={groupKey}>
                {/* Group Header */}
                {timeFilter === 'all' && (
                  <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {TIME_GROUPS[groupKey]}
                    </h3>
                  </div>
                )}
                
                {/* Group Items */}
                {groupLogs.map((log) => (
                  <ActivityItem
                    key={log.id}
                    log={log}
                    onApprove={onApprove}
                    onRollback={onRollback}
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}



