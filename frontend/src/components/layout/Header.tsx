import { useState, useRef, useEffect } from 'react'
import { Bell, LogOut, User, Sun, Moon, Laptop, Menu, Search, Plus, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/lib/ThemeContext'

interface HeaderProps {
  setMobileOpen: (open: boolean) => void
  onSearchClick: () => void
}

const mockNotifications = [
  { id: 1, title: 'Lead Captured', body: 'New lead john@acme.com was captured by Support Bot.', time: '5m ago', read: false },
  { id: 2, title: 'Handoff Requested', body: 'Visitor is waiting for a live agent in chat #208.', time: '12m ago', read: false },
  { id: 3, title: 'System Index Finished', body: 'Knowledge base docs indexed successfully.', time: '1h ago', read: true },
]

export default function Header({
  setMobileOpen,
  onSearchClick
}: HeaderProps) {
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()

  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(2)

  const themeRef = useRef<HTMLDivElement>(null)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeMenuOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleMarkAllRead = () => {
    setUnreadCount(0)
  }

  return (
    <header className="h-16 bg-white/70 dark:bg-[#0F172A]/70 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/40 flex items-center justify-between px-4 md:px-8 z-10 transition-colors duration-200">
      {/* Left: Mobile hamburger menu & section detail */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 lg:hidden rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Small desktop breadcrumb context info */}
        <span className="hidden md:inline-flex items-center gap-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          <span>ChatPlatform</span>
          <span className="text-[10px] opacity-60">/</span>
          <span className="text-slate-700 dark:text-slate-300 font-bold">Admin Panel</span>
        </span>
      </div>

      {/* Global Search trigger */}
      <button
        onClick={onSearchClick}
        className="hidden md:flex items-center gap-2.5 px-3.5 py-2 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-200/50 dark:border-slate-800 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-350 transition-colors text-left text-xs min-w-[240px]"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 font-medium">Search dashboard...</span>
        <span className="text-[10px] font-bold opacity-60">Cmd+K</span>
      </button>

      {/* Right: Quick actions, notifications, theme toggles, user profile */}
      <div className="flex items-center gap-2.5">
        
        {/* Quick action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/bots')}
          className="hidden sm:flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-md shadow-indigo-500/10 dark:shadow-none transition-all duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Bot</span>
        </motion.button>

        {/* Theme Toggler Dropdown */}
        <div ref={themeRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(100, 116, 139, 0.08)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            title="Switch Theme"
          >
            {theme === 'light' && <Sun className="w-4.5 h-4.5" />}
            {theme === 'dark' && <Moon className="w-4.5 h-4.5" />}
            {theme === 'system' && <Laptop className="w-4.5 h-4.5" />}
          </motion.button>

          <AnimatePresence>
            {themeMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-36 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-1.5 space-y-0.5 z-50"
              >
                {[
                  { id: 'light', label: 'Light', icon: Sun },
                  { id: 'dark', label: 'Dark', icon: Moon },
                  { id: 'system', label: 'System', icon: Laptop },
                ].map(item => {
                  const Icon = item.icon
                  const active = theme === item.id
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setTheme(item.id as any)
                        setThemeMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                        active
                          ? 'bg-slate-100 dark:bg-slate-850 text-indigo-650 dark:text-indigo-400'
                          : 'text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5" />
                        <span>{item.label}</span>
                      </div>
                      {active && <Check className="w-3 h-3 stroke-[2.5]" />}
                    </button>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications Popover */}
        <div ref={notifRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(100, 116, 139, 0.08)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            )}
          </motion.button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl overflow-hidden z-50"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-64 overflow-y-auto">
                  {mockNotifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3.5 transition-colors cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/40 flex flex-col gap-1 ${
                        !n.read && unreadCount > 0 ? 'bg-indigo-50/10 dark:bg-indigo-500/5' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center gap-1">
                        <p className="text-xs font-bold text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                          {!n.read && unreadCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-indigo-650 dark:bg-indigo-500" />}
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {n.body}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 text-center">
                  <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block">
                    Real-time Logs Sync Active
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1.5" />

        {/* User Profile Avatar Dropdown */}
        <div ref={profileRef} className="relative">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 p-1 pl-1 pr-2.5 rounded-xl border border-slate-200/50 dark:border-slate-850 hover:bg-slate-50/80 dark:hover:bg-slate-900/30 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 bg-gradient-to-tr from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md flex-shrink-0 text-white font-bold text-xs uppercase">
              {user?.name?.slice(0, 1) || 'U'}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-slate-700 dark:text-slate-350 max-w-[90px] truncate">
              {user?.name || 'Admin'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-650 transition-colors" />
          </motion.button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl p-1.5 z-50 space-y-1"
              >
                <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-col gap-0.5">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email || 'admin@acme.com'}</p>
                </div>

                <button
                  onClick={() => {
                    navigate('/settings')
                    setProfileOpen(false)
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-semibold rounded-lg text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Profile Settings</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-bold rounded-lg text-red-500 hover:bg-red-50/50 dark:hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </header>
  )
}
