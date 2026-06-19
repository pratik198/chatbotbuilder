import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Bot, BookOpen, MessageSquare,
  BarChart2, Settings, Zap, Users, Headphones
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { to: '/bots',           label: 'Bots',           icon: Bot },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen },
  { to: '/conversations',  label: 'Conversations',  icon: MessageSquare },
  { to: '/live-chat',      label: 'Live Chat',      icon: Headphones },
  { to: '/contacts',       label: 'Contacts',       icon: Users },
  { to: '/analytics',      label: 'Analytics',      icon: BarChart2 },
  { to: '/settings',       label: 'Settings',       icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="w-60 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-gray-200">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-semibold text-gray-900">ChatPlatform</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )
            }
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
