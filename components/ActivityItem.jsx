'use client'

import { format, formatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns'
import { 
  Mail, 
  CheckSquare, 
  Calendar, 
  Users, 
  AlertTriangle, 
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle
} from 'lucide-react'

/**
 * Professional Activity Item Component
 * Displays a single AI COO action in a clean, business-facing card
 */

// Icon mapping for action types
const getActionIcon = (actionType) => {
  const iconMap = {
    classify_email: Mail,
    create_task: CheckSquare,
    send_email: MessageSquare,
    schedule_followup: Calendar,
    update_crm: Users,
    generate_reply: MessageSquare,
    process_email: Mail,
    generate_daily_summary: FileText,
    generate_weekly_planner: Calendar,
    default: Clock,
  }
  return iconMap[actionType] || iconMap.default
}

// Status indicator colors
const getStatusColor = (status) => {
  const statusMap = {
    completed: 'bg-emerald-50 border-emerald-200',
    success: 'bg-emerald-50 border-emerald-200',
    executed: 'bg-emerald-50 border-emerald-200',
    pending_approval: 'bg-amber-50 border-amber-200',
    requires_approval: 'bg-amber-50 border-amber-200',
    failed: 'bg-red-50 border-red-200',
    blocked_by_safety: 'bg-red-50 border-red-200',
    rolled_back: 'bg-gray-50 border-gray-200',
    default: 'bg-gray-50 border-gray-200',
  }
  return statusMap[status] || statusMap.default
}

// Status indicator icon
const getStatusIcon = (status) => {
  if (status === 'completed' || status === 'success' || status === 'executed') {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600" />
  }
  if (status === 'pending_approval' || status === 'requires_approval') {
    return <AlertCircle className="w-4 h-4 text-amber-600" />
  }
  if (status === 'failed' || status === 'blocked_by_safety') {
    return <XCircle className="w-4 h-4 text-red-600" />
  }
  return <Clock className="w-4 h-4 text-gray-600" />
}

// Professional action descriptions
const getActionDescription = (actionType, inputData, outputData) => {
  const descriptions = {
    classify_email: () => {
      const subject = inputData?.subject || inputData?.emailId || 'email'
      return `Classified email`
    },
    create_task: () => {
      const title = outputData?.taskId ? 'Task created' : inputData?.task?.title || inputData?.title || 'New task'
      return `Created task: ${title.length > 40 ? title.substring(0, 40) + '...' : title}`
    },
    send_email: () => {
      const to = inputData?.to || inputData?.emailId || 'recipient'
      return `Replied to email`
    },
    schedule_followup: () => {
      return 'Scheduled follow-up'
    },
    update_crm: () => {
      const status = outputData?.status || 'lead'
      return `Updated CRM: ${status}`
    },
    generate_reply: () => {
      return 'Drafted email reply'
    },
    process_email: () => {
      return 'Processed incoming email'
    },
    generate_daily_summary: () => {
      return 'Generated daily summary'
    },
    generate_weekly_planner: () => {
      return 'Generated weekly planner'
    },
  }
  
  const getter = descriptions[actionType] || (() => {
    // Convert action_type to "Action Type"
    return actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  })
  return getter()
}

// Get context information
const getContext = (actionType, inputData, outputData) => {
  const contexts = []
  
  if (inputData?.from) {
    // Extract name from email if possible
    const from = inputData.from.includes('@') 
      ? inputData.from.split('@')[0].replace(/[._]/g, ' ')
      : inputData.from
    contexts.push(from)
  }
  if (inputData?.emailId || inputData?.subject) {
    contexts.push('Inbox')
  }
  if (inputData?.subject && inputData.subject.length < 50) {
    contexts.push(inputData.subject)
  }
  if (inputData?.to && !inputData.from) {
    contexts.push(`To: ${inputData.to.split('@')[0]}`)
  }
  
  return contexts.length > 0 ? contexts.slice(0, 3).join(' • ') : null
}

// Format timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  
  if (isToday(date)) {
    return `Today ${format(date, 'h:mm a')}`
  }
  if (isYesterday(date)) {
    return `Yesterday ${format(date, 'h:mm a')}`
  }
  if (isThisWeek(date)) {
    return format(date, 'EEE h:mm a')
  }
  return format(date, 'MMM d, yyyy h:mm a')
}

export default function ActivityItem({ log, onApprove, onRollback }) {
  const Icon = getActionIcon(log.actionType)
  const statusColor = getStatusColor(log.status)
  const StatusIcon = getStatusIcon(log.status)
  const actionDescription = getActionDescription(log.actionType, log.inputData, log.outputData)
  const context = getContext(log.actionType, log.inputData, log.outputData)
  const timestamp = formatTimestamp(log.createdAt || log.timestamp || new Date())
  
  const needsApproval = log.status === 'pending_approval' || log.status === 'requires_approval'
  const canRollback = log.metadata?.canRollback && log.status !== 'rolled_back'
  
  // Professional explanation (1 line max)
  const explanation = log.explanation 
    ? log.explanation.split('\n')[0].substring(0, 120) + (log.explanation.length > 120 ? '...' : '')
    : null

  return (
    <div className={`p-5 border-l-4 ${statusColor} bg-white hover:bg-gray-50/50 transition-all duration-200 hover:shadow-sm`}>
      <div className="flex gap-4">
        {/* Left: Icon + Status Indicator */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
            <Icon className="w-5 h-5 text-gray-700" />
          </div>
          <div className="mt-2 flex justify-center">
            {StatusIcon}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Primary Line */}
          <div className="flex items-start justify-between gap-4 mb-1">
            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
              {actionDescription}
            </h3>
            {needsApproval && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                Needs Approval
              </span>
            )}
          </div>

          {/* Secondary Context */}
          {context && (
            <p className="text-xs text-gray-500 mb-2 truncate">
              {context}
            </p>
          )}

          {/* Explanation */}
          {explanation && (
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {explanation}
            </p>
          )}

          {/* Meta Row */}
          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-500">
            <span>{timestamp}</span>
            {typeof log.confidenceScore === 'number' && (
              <>
                <span>•</span>
                <span className="font-medium">
                  {log.confidenceScore}% confidence
                </span>
              </>
            )}
            {log.agentName && (
              <>
                <span>•</span>
                <span>{log.agentName}</span>
              </>
            )}
            {log.riskLevel && log.riskLevel !== 'low' && (
              <>
                <span>•</span>
                <span className={`px-1.5 py-0.5 rounded ${
                  log.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                  log.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {log.riskLevel} risk
                </span>
              </>
            )}
          </div>

          {/* Action Row */}
          {(needsApproval || canRollback) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
              {needsApproval && onApprove && (
                <button
                  onClick={() => onApprove(log)}
                  className="px-4 py-2 text-xs font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                >
                  Approve
                </button>
              )}
              {canRollback && onRollback && (
                <button
                  onClick={() => onRollback(log)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200"
                >
                  Undo
                </button>
              )}
              <button className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200">
                View details
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

