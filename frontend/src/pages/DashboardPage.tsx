import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MessageSquare, Bot, TrendingUp, Zap, Clock, ChevronRight } from 'lucide-react'
import { formatNumber, formatMs } from '@/lib/utils'
import api from '@/lib/api'

interface Summary {
  totalConversations: number
  totalMessages: number
  totalLeads: number
  avgResponseTimeMs: number
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
}

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 120, damping: 18 } }
}

function StatCard({ label, value, icon: Icon, color, glowClass }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  glowClass: string
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`glass-panel ${glowClass} rounded-2xl p-6 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-36`}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-slate-500/90">{label}</span>
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100`}>
          <Icon className="w-5 h-5 text-white fill-white/10" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs text-slate-400 mt-1 font-medium">Updated just now</p>
      </div>
      {/* Decorative background glow inside the card */}
      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data: summary, isLoading } = useQuery<Summary>({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary?days=30').then((r) => r.data.data ?? r.data),
    placeholderData: { totalConversations: 0, totalMessages: 0, totalLeads: 0, avgResponseTimeMs: 0 },
  })

  const { data: bots } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.get('/bots').then((r) => r.data.data?.items ?? []),
    placeholderData: [],
  })

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.08
          }
        }
      }}
      className="space-y-8"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-900 via-slate-800 to-indigo-950 tracking-tight">
            Overview
          </h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Metrics for the last 30 days</p>
        </div>
        <div className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-100/50">
          Live Sync
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          label="Conversations"
          value={isLoading ? '...' : formatNumber(summary!.totalConversations)}
          icon={MessageSquare}
          color="bg-gradient-to-tr from-blue-600 to-indigo-500"
          glowClass="glow-primary"
        />
        <StatCard
          label="Messages"
          value={isLoading ? '...' : formatNumber(summary!.totalMessages)}
          icon={TrendingUp}
          color="bg-gradient-to-tr from-emerald-500 to-teal-400"
          glowClass="glow-green"
        />
        <StatCard
          label="Leads Captured"
          value={isLoading ? '...' : formatNumber(summary!.totalLeads)}
          icon={Zap}
          color="bg-gradient-to-tr from-violet-600 to-purple-500"
          glowClass="glow-purple"
        />
        <StatCard
          label="Avg Response Time"
          value={isLoading ? '...' : formatMs(summary!.avgResponseTimeMs)}
          icon={Clock}
          color="bg-gradient-to-tr from-orange-500 to-amber-400"
          glowClass="glow-orange"
        />
      </div>

      {/* Bots list */}
      <motion.div 
        variants={cardVariants}
        className="glass-panel rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-slate-800 text-base">Your Active Bots</h2>
          <a href="/bots" className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 group transition-colors">
            View all bots
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
        <motion.div 
          variants={listContainerVariants}
          className="divide-y divide-slate-100"
        >
          {(bots as any[]).length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-400 bg-white/50">
              <Bot className="w-12 h-12 mx-auto mb-3 opacity-30 text-indigo-500" />
              <p className="text-sm font-medium">No bots available yet.</p>
              <a href="/bots" className="text-xs font-semibold text-indigo-600 hover:underline mt-1.5 block">Create your first bot</a>
            </div>
          ) : (
            (bots as any[]).slice(0, 5).map((bot: any) => (
              <motion.div 
                key={bot.id} 
                variants={listItemVariants}
                whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.6)", x: 4 }}
                className="flex items-center justify-between px-6 py-4 transition-colors bg-white/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100/50">
                    <Bot className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{bot.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{bot.modelName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                    bot.status === 'active' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' 
                      : 'bg-slate-100 text-slate-500 border border-slate-200/50'
                  }`}>
                    {bot.status}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

