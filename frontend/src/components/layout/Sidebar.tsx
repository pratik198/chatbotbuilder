import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Bot, BookOpen, MessageSquare,
  BarChart2, Settings, Zap, Users, Headphones,
  ChevronLeft, ChevronRight, Search, LogOut,
  Building2, Command, User
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

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

interface SidebarProps {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
  onSearchClick: () => void
}

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  onSearchClick
}: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const renderContent = (isMobile = false) => {
    const isCollapsed = !isMobile && collapsed

    return (
      <div className="h-full flex flex-col justify-between py-5 bg-white dark:bg-[#0F172A] border-r border-slate-200/50 dark:border-slate-800/40 relative">
        {/* Top: Logo & Workspace Switcher */}
        <div className="px-4">
          <div className={cn("flex items-center gap-3.5 mb-6", isCollapsed ? "justify-center" : "px-2")}>
            <motion.div
              className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0 cursor-pointer"
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
            >
              <Zap className="w-5.5 h-5.5 text-white fill-white/10" />
            </motion.div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-slate-850 dark:text-slate-100 text-[15px] tracking-tight leading-none">
                  ChatPlatform
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1 uppercase tracking-wider">
                  Enterprise
                </span>
              </div>
            )}
          </div>

          {/* Workspace Switcher */}
          <div className="mb-4">
            {isCollapsed ? (
              <button className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                <Building2 className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl border border-slate-200/50 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 text-left text-sm text-slate-700 dark:text-slate-300 font-medium transition-all duration-200 group">
                <div className="w-6.5 h-6.5 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase flex-shrink-0">
                  {user?.name?.slice(0, 2) || 'CP'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-none">
                    {user?.name || 'Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-1">
                    Personal Workspace
                  </p>
                </div>
              </button>
            )}
          </div>

          {/* Search Trigger */}
          <div className="mb-5">
            {isCollapsed ? (
              <button
                onClick={onSearchClick}
                className="mx-auto w-10 h-10 rounded-xl flex items-center justify-center border border-slate-200/40 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/20 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 transition-colors"
                title="Search (Cmd+K)"
              >
                <Search className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={onSearchClick}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/40 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 hover:bg-slate-100/60 dark:hover:bg-slate-800/20 text-slate-400 dark:text-slate-500 text-left transition-colors"
              >
                <Search className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1 text-xs font-medium">Search...</span>
                <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                  <Command className="w-2.5 h-2.5" />
                  <span>K</span>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => isMobile && setMobileOpen(false)}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 group overflow-hidden',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                    : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/30 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn("w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200", isActive ? "scale-105" : "opacity-75 group-hover:scale-105")} />
                  {(!isCollapsed || isMobile) && <span className="truncate">{label}</span>}
                  
                  {/* Tooltip on compact mode */}
                  {isCollapsed && !isMobile && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-xl z-50">
                      {label}
                    </div>
                  )}

                  {isActive && !isCollapsed && (
                    <motion.div
                      layoutId="activeSideBarGlow"
                      className="absolute right-0 top-1/4 w-0.75 h-1/2 bg-white rounded-l-full"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom: User Card & Collapsible toggle */}
        <div className="px-3 pt-4 border-t border-slate-200/50 dark:border-slate-800/40">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-md cursor-pointer hover:opacity-90 relative group">
                <User className="w-4 h-4" />
                <div className="absolute left-12 top-1/2 -translate-y-1/2 ml-2 p-3.5 rounded-xl bg-white dark:bg-[#1E293B] border border-slate-250 dark:border-slate-800/80 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 flex flex-col gap-1.5 min-w-[150px]">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user?.name || user?.email}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</p>
                  <button onClick={handleLogout} className="mt-1 flex items-center gap-1.5 text-[10px] text-red-500 hover:text-red-600 font-bold uppercase tracking-wider">
                    <LogOut className="w-3 h-3" /> Log out
                  </button>
                </div>
              </div>
              <button
                onClick={() => setCollapsed(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Profile Card */}
              <div className="flex items-center gap-3 px-2.5 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-900/10 border border-slate-200/20 dark:border-slate-800/30">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold shadow-md flex-shrink-0">
                  <User className="w-4.5 h-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate leading-none">
                    {user?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-slate-450 dark:text-slate-500 truncate mt-1">
                    {user?.email || 'admin@acme.com'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-red-55/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              {/* Sidebar toggle button (only on desktop) */}
              {!isMobile && (
                <button
                  onClick={() => setCollapsed(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-slate-650 dark:hover:text-slate-350 hover:bg-slate-100/50 dark:hover:bg-slate-800/30 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Collapse Sidebar</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      {/* 1. Desktop Sidebar */}
      <aside className={cn(
        "hidden lg:block bg-white dark:bg-[#0F172A] z-20 flex-shrink-0 transition-all duration-300",
        collapsed ? "w-20" : "w-64"
      )}>
        {renderContent(false)}
      </aside>

      {/* 2. Mobile Sidebar Slide-over Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Slide Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-64 max-w-[80vw] h-full shadow-2xl flex flex-col"
            >
              {renderContent(true)}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
