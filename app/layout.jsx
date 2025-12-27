import { Inter } from 'next/font/google'
import './globals.css'
import ErrorBoundary from '@/components/ErrorBoundary'
import AnalyticsProvider from '@/components/AnalyticsProvider'

// Initialize environment validation
if (typeof window === 'undefined') {
  try {
    require('@/lib/env-validator')
  } catch (error) {
    // Silently fail in development
  }
}

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'AI COO - Your AI Chief Operating Officer',
  description: 'Automate your business operations with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}



