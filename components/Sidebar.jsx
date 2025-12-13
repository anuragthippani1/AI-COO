'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Inbox', href: '/inbox', icon: '📧' },
  { name: 'Tasks', href: '/tasks', icon: '✅' },
  { name: 'WhatsApp', href: '/whatsapp', icon: '💬' },
  { name: 'CRM / Leads', href: '/crm', icon: '👥' },
  { name: 'Invoices', href: '/invoices', icon: '📄' },
  { name: 'Proposals', href: '/proposals', icon: '📋' },
  { name: 'Planner', href: '/planner', icon: '📅' },
  { name: 'Agents', href: '/agents', icon: '🤖' },
  { name: 'Automations', href: '/automations', icon: '⚙️' },
  { name: 'Reports', href: '/reports', icon: '📈' },
  { name: 'Settings', href: '/settings', icon: '⚙️' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900">
            AI COO
          </h2>
          <p className="text-xs text-gray-500 mt-1">Your AI Operations Assistant</p>
        </div>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}



