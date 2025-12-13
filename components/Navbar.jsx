'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'

export default function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    setIsLoggedIn(!!token)

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    router.push('/')
  }

  const isActive = (path) => pathname === path

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-black/80 backdrop-blur-md border-b border-purple-500/30'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hover:scale-105 transition-transform duration-300"
          >
            AI COO
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              href="/#features"
              className={`text-gray-300 hover:text-purple-400 transition-colors duration-300 ${
                pathname === '/' ? 'text-purple-400' : ''
              }`}
            >
              Features
            </Link>
            {isLoggedIn ? (
              <>
                <Link
                  href="/dashboard"
                  className={`text-gray-300 hover:text-purple-400 transition-colors duration-300 ${
                    isActive('/dashboard') ? 'text-purple-400 font-medium' : ''
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/inbox"
                  className={`text-gray-300 hover:text-purple-400 transition-colors duration-300 ${
                    isActive('/inbox') ? 'text-purple-400 font-medium' : ''
                  }`}
                >
                  Inbox
                </Link>
                <Link
                  href="/tasks"
                  className={`text-gray-300 hover:text-purple-400 transition-colors duration-300 ${
                    isActive('/tasks') ? 'text-purple-400 font-medium' : ''
                  }`}
                >
                  Tasks
                </Link>
              </>
            ) : null}
            <Link
              href="/pricing"
              className={`text-gray-300 hover:text-purple-400 transition-colors duration-300 ${
                isActive('/pricing') ? 'text-purple-400 font-medium' : ''
              }`}
            >
              Pricing
            </Link>
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="text-gray-300 hover:text-purple-400 transition-colors duration-300"
              >
                Logout
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-300 hover:text-white transition-colors duration-300"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="relative px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-medium overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)]"
                >
                  <span className="relative z-10">Get Started</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-300 hover:text-purple-400 transition-colors">
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
