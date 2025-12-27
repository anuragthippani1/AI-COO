import { NextResponse } from 'next/server'

// Generate request ID (inline to avoid Edge runtime issues)
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function middleware(request) {
  const requestId = generateRequestId()
  const response = NextResponse.next()
  
  // Add request ID to headers for tracing
  response.headers.set('X-Request-ID', requestId)
  
  return response
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
}

