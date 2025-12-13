'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { useEffect, useState } from 'react'

export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div
          className="absolute w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"
          style={{
            left: `${mousePosition.x / 20}px`,
            top: `${mousePosition.y / 20}px`,
            transition: 'all 0.3s ease-out',
          }}
        />
        <div
          className="absolute w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse delay-300"
          style={{
            right: `${mousePosition.x / 25}px`,
            bottom: `${mousePosition.y / 25}px`,
            transition: 'all 0.3s ease-out',
          }}
        />
      </div>

      <Navbar />

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-32 text-center">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8 animate-fade-in">
              <span className="inline-block px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-full text-purple-300 text-sm font-medium backdrop-blur-sm">
                ✨ AI-Powered Operations
              </span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-slide-up">
              Your AI Chief Operating Officer
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed animate-slide-up delay-100">
              Automate email management, task extraction, follow-ups, and more with
              <span className="text-purple-400 font-semibold"> AI-powered workflows</span>
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up delay-200">
              <Link
                href="/register"
                className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold text-lg overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.6)]"
              >
                <span className="relative z-10">Start Free Trial</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
              
              <Link
                href="/pricing"
                className="px-8 py-4 bg-white/10 backdrop-blur-md border border-purple-500/50 rounded-lg text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 hover:border-purple-400 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Powerful Features
            </h2>
            <p className="text-gray-400 text-lg">Everything you need to automate your operations</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature Card 1 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                <div className="text-4xl mb-4">📧</div>
                <h3 className="text-2xl font-bold text-white mb-3">Email Automation</h3>
                <p className="text-gray-400 leading-relaxed">
                  Automatically extract tasks from emails, generate replies, and manage your inbox with AI intelligence
                </p>
                <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Feature Card 2 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8 hover:border-blue-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-2xl font-bold text-white mb-3">AI Agent</h3>
                <p className="text-gray-400 leading-relaxed">
                  Intelligent agent with memory, tools, and workflows to handle complex operations autonomously
                </p>
                <div className="mt-4 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>

            {/* Feature Card 3 */}
            <div className="group relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-2xl font-bold text-white mb-3">Multi-Channel Follow-ups</h3>
                <p className="text-gray-400 leading-relaxed">
                  Automated follow-up messages via WhatsApp, email, and SMS with intelligent scheduling
                </p>
                <div className="mt-4 h-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[
              { label: 'Tasks Automated', value: '10K+', color: 'purple' },
              { label: 'Emails Processed', value: '50K+', color: 'blue' },
              { label: 'Follow-ups Sent', value: '25K+', color: 'purple' },
              { label: 'Happy Users', value: '1K+', color: 'blue' },
            ].map((stat, index) => (
              <div
                key={index}
                className="bg-white/5 backdrop-blur-md border border-purple-500/30 rounded-xl p-6 text-center hover:border-purple-400/50 transition-all duration-300 hover:scale-105"
              >
                <div className={`text-4xl font-bold mb-2 bg-gradient-to-r from-${stat.color}-400 to-${stat.color === 'purple' ? 'blue' : 'purple'}-400 bg-clip-text text-transparent`}>
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-md border border-purple-500/30 rounded-3xl p-12 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-blue-600/10 animate-pulse" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Ready to Transform Your Operations?
                </h2>
                <p className="text-xl text-gray-300 mb-8">
                  Join thousands of businesses automating their workflows with AI
                </p>
                <Link
                  href="/register"
                  className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white font-semibold text-lg hover:scale-105 transition-all duration-300 hover:shadow-[0_0_40px_rgba(147,51,234,0.6)]"
                >
                  Get Started Free →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-purple-500/20 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>© 2024 AI COO. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }

        .animate-slide-up {
          animation: slide-up 0.8s ease-out forwards;
          opacity: 0;
        }

        .delay-100 {
          animation-delay: 0.1s;
        }

        .delay-200 {
          animation-delay: 0.2s;
        }

        .delay-300 {
          animation-delay: 0.3s;
        }
      `}</style>
    </div>
  )
}
