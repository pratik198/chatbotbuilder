import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Bot, MessageSquare, BookOpen, Users, BarChart2, Settings, Headphones, Command } from 'lucide-react'

interface CommandPaletteProps {
  open: boolean
  setOpen: (open: boolean) => void
}

const ITEMS = [
  { to: '/dashboard',      label: 'Dashboard',      icon: BarChart2,     category: 'Navigation' },
  { to: '/bots',           label: 'Bots',           icon: Bot,           category: 'Navigation' },
  { to: '/knowledge-base', label: 'Knowledge Base', icon: BookOpen,      category: 'Navigation' },
  { to: '/conversations',  label: 'Conversations',  icon: MessageSquare,  category: 'Navigation' },
  { to: '/live-chat',      label: 'Live Chat',      icon: Headphones,    category: 'Navigation' },
  { to: '/contacts',       label: 'Contacts',       icon: Users,         category: 'Navigation' },
  { to: '/analytics',      label: 'Analytics',      icon: BarChart2,     category: 'Navigation' },
  { to: '/settings',       label: 'Settings',       icon: Settings,      category: 'Navigation' },
]

export default function CommandPalette({ open, setOpen }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(!open)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  const filtered = ITEMS.filter(item =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  )

  const handleSelect = (to: string) => {
    navigate(to)
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % filtered.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].to)
      }
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-800/80 shadow-2xl flex flex-col mx-4"
          >
            {/* Input area */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-100 dark:border-slate-800/50">
              <Search className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => {
                  setQuery(e.target.value)
                  setSelectedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search menu pages or tools..."
                className="flex-1 py-4 text-sm bg-transparent border-0 outline-none text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
              />
              <div className="flex items-center gap-0.5 px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                <Command className="w-2.5 h-2.5" />
                <span>K</span>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-80 p-2 space-y-1">
              {filtered.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500 font-medium">
                  No matching options found.
                </div>
              ) : (
                filtered.map((item, idx) => {
                  const Icon = item.icon
                  const active = idx === selectedIndex
                  return (
                    <button
                      key={item.to}
                      onClick={() => handleSelect(item.to)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all ${
                        active
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                    >
                      <Icon className={`w-4.5 h-4.5 ${active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                      <span className="flex-1">{item.label}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-indigo-200' : 'text-slate-400 dark:text-slate-500'}`}>
                        {item.category}
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-800/20 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <span>↑↓ navigate</span>
                <span>↵ select</span>
              </div>
              <span>esc to dismiss</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
