import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    <aside className="w-64 bg-white/80 backdrop-blur-lg border-r border-slate-200/60 flex flex-col z-10">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-slate-200/50">
        <motion.div 
          className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <Zap className="w-5 h-5 text-white fill-white/20" />
        </motion.div>
        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 to-slate-800 text-lg">
          ChatPlatform
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden',
                isActive
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200", isActive ? "scale-110" : "opacity-80")} />
                <span>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeGlow"
                    className="absolute right-0 top-1/4 w-1 h-1/2 bg-white rounded-l-full"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

