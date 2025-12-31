// Analytics wrapper for PostHog
'use client'

let posthog = null

export function initAnalytics() {
  if (typeof window === 'undefined') return

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

  if (!posthogKey) {
    console.warn('PostHog key not configured, analytics disabled')
    return
  }

  try {
    // Dynamic import to avoid SSR issues
    import('posthog-js').then(({ default: posthogModule }) => {
      posthog = posthogModule
      posthog.init(posthogKey, {
        api_host: posthogHost,
        loaded: (posthog) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('PostHog initialized')
          }
        },
      })
    })
  } catch (error) {
    console.error('Failed to initialize PostHog:', error)
  }
}

export function trackEvent(eventName, properties = {}) {
  if (typeof window === 'undefined') return

  if (posthog) {
    posthog.capture(eventName, properties)
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventName, properties)
  }
}

export function identifyUser(userId, properties = {}) {
  if (typeof window === 'undefined') return

  if (posthog) {
    posthog.identify(userId, properties)
  } else if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics] Identify:', userId, properties)
  }
}

export function resetUser() {
  if (typeof window === 'undefined') return

  if (posthog) {
    posthog.reset()
  }
}





