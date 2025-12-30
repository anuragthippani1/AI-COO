// Environment variable validation on app startup

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
]

const recommendedEnvVars = [
  'OPENAI_API_KEY',
  'PINECONE_API_KEY',
]

export function validateEnv() {
  const missing = []
  const warnings = []

  // Check required variables
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }

  // Check recommended variables
  for (const envVar of recommendedEnvVars) {
    if (!process.env[envVar]) {
      warnings.push(envVar)
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach((envVar) => {
      console.error(`   - ${envVar}`)
    })
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  if (warnings.length > 0) {
    console.warn('⚠️  Missing recommended environment variables (some features may not work):')
    warnings.forEach((envVar) => {
      console.warn(`   - ${envVar}`)
    })
  }

  if (missing.length === 0 && warnings.length === 0) {
    console.log('✅ All environment variables validated')
  }
}

// Run validation on import (for server-side)
if (typeof window === 'undefined') {
  try {
    validateEnv()
  } catch (error) {
    // Don't throw in development to allow partial functionality
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}




