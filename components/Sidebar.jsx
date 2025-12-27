'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Activity,
  Inbox,
  CheckSquare,
  MessageCircle,
  Users,
  FileText,
  FileCheck,
  Calendar,
  Bot,
  Settings,
  Workflow,
  BarChart3,
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Inbox', href: '/inbox', icon: Inbox },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageCircle },
  { name: 'CRM / Leads', href: '/crm', icon: Users },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Proposals', href: '/proposals', icon: FileCheck },
  { name: 'Planner', href: '/planner', icon: Calendar },
  { name: 'Agents', href: '/agents', icon: Bot },
  { name: 'Automations', href: '/automations', icon: Workflow },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r border-gray-100 min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
            <span className="text-white text-sm font-bold">AI</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 leading-tight">
              AI COO
            </h2>
            <p className="text-xs text-gray-500 leading-tight">Operations Assistant</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {/* Left border indicator for active item */}
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-indigo-500 to-violet-600 rounded-r-full" />
              )}
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${
                  isActive ? 'text-indigo-600' : 'text-gray-500 group-hover:text-gray-700'
                }`}
              />
              <span className="text-sm leading-tight">{item.name}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}



