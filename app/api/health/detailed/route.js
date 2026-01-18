import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {},
  }

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`
    checks.checks.database = { status: 'ok', message: 'Database connection successful' }
  } catch (error) {
    checks.status = 'degraded'
    checks.checks.database = {
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
    }
  }

  // OpenAI check (optional)
  if (process.env.OPENAI_API_KEY) {
    checks.checks.openai = { status: 'ok', message: 'OpenAI API key configured' }
  } else {
    checks.checks.openai = { status: 'warning', message: 'OpenAI API key not configured' }
  }

  // Pinecone check (optional)
  if (process.env.PINECONE_API_KEY) {
    checks.checks.pinecone = { status: 'ok', message: 'Pinecone API key configured' }
  } else {
    checks.checks.pinecone = { status: 'warning', message: 'Pinecone API key not configured' }
  }

  // Environment check
  checks.checks.environment = {
    status: 'ok',
    environment: process.env.NODE_ENV,
    nodeVersion: process.version,
  }

  const statusCode = checks.status === 'ok' ? 200 : 503

  return NextResponse.json(checks, { status: statusCode })
}






