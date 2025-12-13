'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    router.push('/')
  }

  const isActive = (path) => pathname === path

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            AI COO
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/#features"
              className={`text-gray-600 hover:text-primary-600 transition ${
                pathname === '/' ? 'text-primary-600' : ''
              }`}
            >
              Features
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-gray-600 hover:text-primary-600 transition ${
                    isActive('/dashboard') ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/inbox"
                  className={`text-gray-600 hover:text-primary-600 transition ${
                    isActive('/inbox') ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  Inbox
                </Link>
                <Link
                  href="/tasks"
                  className={`text-gray-600 hover:text-primary-600 transition ${
                    isActive('/tasks') ? 'text-primary-600 font-medium' : ''
                  }`}
                >
                  Tasks
                </Link>
              </>
            ) : null}
            <Link
              href="/pricing"
              className={`text-gray-600 hover:text-primary-600 transition ${
                isActive('/pricing') ? 'text-primary-600 font-medium' : ''
              }`}
            >
              Pricing
            </Link>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-primary-600 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 transition"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-primary-100 text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-primary-200 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

