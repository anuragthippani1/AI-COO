/**
 * Event System for Agent-Driven Architecture
 * All system events that trigger agent actions
 */

export const EVENTS = {
  // Email events
  NEW_EMAIL_RECEIVED: 'NEW_EMAIL_RECEIVED',
  EMAIL_REPLY_NEEDED: 'EMAIL_REPLY_NEEDED',
  
  // Task events
  TASK_OVERDUE: 'TASK_OVERDUE',
  TASK_DUE_SOON: 'TASK_DUE_SOON',
  
  // Follow-up events
  FOLLOWUP_DUE: 'FOLLOWUP_DUE',
  FOLLOWUP_OVERDUE: 'FOLLOWUP_OVERDUE',
  
  // Calendar events
  CALENDAR_EVENT_SOON: 'CALENDAR_EVENT_SOON',
  CALENDAR_EVENT_STARTING: 'CALENDAR_EVENT_STARTING',
  
  // Financial events
  INVOICE_OVERDUE: 'INVOICE_OVERDUE',
  INVOICE_DUE_SOON: 'INVOICE_DUE_SOON',
  
  // Time-based events
  DAILY_SUMMARY_TIME: 'DAILY_SUMMARY_TIME',
  WEEKLY_PLANNING_TIME: 'WEEKLY_PLANNING_TIME',
  END_OF_DAY: 'END_OF_DAY',
  
  // CRM events
  LEAD_STALE: 'LEAD_STALE',
  LEAD_QUALIFIED: 'LEAD_QUALIFIED',
  
  // System events
  USER_APPROVAL_RECEIVED: 'USER_APPROVAL_RECEIVED',
  USER_REJECTION_RECEIVED: 'USER_REJECTION_RECEIVED',
}

/**
 * Event emitter/listener system
 */
class EventSystem {
  constructor() {
    this.listeners = new Map()
  }

  /**
   * Register an event listener
   * @param {string} eventType - Event type from EVENTS
   * @param {Function} handler - Handler function (userId, eventData) => Promise<void>
   */
  on(eventType, handler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, [])
    }
    this.listeners.get(eventType).push(handler)
  }

  /**
   * Emit an event
   * @param {string} eventType - Event type
   * @param {string} userId - User ID
   * @param {object} eventData - Event data
   */
  async emit(eventType, userId, eventData = {}) {
    const handlers = this.listeners.get(eventType) || []
    
    for (const handler of handlers) {
      try {
        await handler(userId, eventData)
      } catch (error) {
        console.error(`[EventSystem] Error handling ${eventType}:`, error)
      }
    }
  }

  /**
   * Remove all listeners (for testing/cleanup)
   */
  clear() {
    this.listeners.clear()
  }
}

// Singleton instance
export const eventSystem = new EventSystem()



