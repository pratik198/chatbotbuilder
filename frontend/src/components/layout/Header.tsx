import { Bell, LogOut, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header className="h-16 bg-white/70 backdrop-blur-lg border-b border-slate-200/50 flex items-center justify-between px-8 z-10">
      <div />
      <div className="flex items-center gap-4">
        <motion.button 
          whileHover={{ scale: 1.05, backgroundColor: "rgba(241, 245, 249, 0.8)" }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 transition-colors"
        >
          <Bell className="w-4.5 h-4.5" />
        </motion.button>
        
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200/80">
          <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-blue-600 rounded-full flex items-center justify-center shadow-md shadow-indigo-100">
            <User className="w-4.5 h-4.5 text-white" />
          </div>
          <span className="text-sm text-slate-700 font-semibold">{user?.name || user?.email}</span>
          
          <motion.button
            whileHover={{ scale: 1.05, x: 2 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50/50 transition-all duration-200 ml-1"
            title="Log out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </motion.button>
        </div>
      </div>
    </header>
  )
}

