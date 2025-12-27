import * as Sentry from '@sentry/nextjs'

const dsn = process.env.SENTRY_DSN

// Only initialize if DSN is provided
if (dsn) {
  Sentry.init({
    dsn,
  
  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: process.env.NODE_ENV === 'development',
  
    environment: process.env.NODE_ENV,
  })
}

