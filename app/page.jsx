import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />

      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your AI Chief Operating Officer
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Automate email management, task extraction, follow-ups, and more with
            AI-powered workflows
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/register"
              className="bg-primary-100 text-gray-900 font-medium px-8 py-3 rounded-lg text-lg hover:bg-primary-200"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg text-lg hover:bg-primary-50"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mt-20 mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3">📧 Email Automation</h3>
              <p className="text-gray-600">
                Automatically extract tasks from emails, generate replies, and
                manage your inbox
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3">🤖 AI Agent</h3>
              <p className="text-gray-600">
                Intelligent agent with memory, tools, and workflows to handle
                complex operations
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-3">💬 Follow-ups</h3>
              <p className="text-gray-600">
                Automated follow-up messages via WhatsApp, email, and SMS
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

