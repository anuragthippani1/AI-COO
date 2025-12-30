// Structured logging utility

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
}

const currentLogLevel = process.env.LOG_LEVEL
  ? LOG_LEVELS[process.env.LOG_LEVEL.toUpperCase()] || LOG_LEVELS.INFO
  : process.env.NODE_ENV === 'production'
  ? LOG_LEVELS.INFO
  : LOG_LEVELS.DEBUG

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    message,
    ...meta,
  }

  if (process.env.NODE_ENV === 'production') {
    // In production, output JSON for log aggregation services
    return JSON.stringify(logEntry)
  } else {
    // In development, output readable format
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ''
    return `[${timestamp}] [${level}] ${message}${metaStr}`
  }
}

export const logger = {
  error(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      console.error(formatLog('ERROR', message, meta))
    }
  },

  warn(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      console.warn(formatLog('WARN', message, meta))
    }
  },

  info(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      console.log(formatLog('INFO', message, meta))
    }
  },

  debug(message, meta = {}) {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      console.log(formatLog('DEBUG', message, meta))
    }
  },
}

// Request ID middleware helper
export function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}




