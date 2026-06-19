import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { MessageSquare, Bot, TrendingUp, Zap, Clock, ChevronRight, Sparkles, Smile, ArrowUpRight } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'
import { formatNumber, formatMs } from '@/lib/utils'
import api from '@/lib/api'

interface Summary {
  totalConversations: number
  totalMessages: number
  totalLeads: number
  avgResponseTimeMs: number
}

// Generate simple mock sparkline data
const sparkData1 = [
  { value: 12 }, { value: 18 }, { value: 15 }, { value: 24 }, { value: 35 }, { value: 30 }, { value: 45 }
]
const sparkData2 = [
  { value: 140 }, { value: 120 }, { value: 190 }, { value: 230 }, { value: 210 }, { value: 300 }, { value: 280 }
]
const sparkData3 = [
  { value: 2 }, { value: 3 }, { value: 3 }, { value: 4 }, { value: 4 }, { value: 5 }, { value: 6 }
]
const sparkData4 = [
  { value: 5 }, { value: 12 }, { value: 8 }, { value: 15 }, { value: 24 }, { value: 20 }, { value: 32 }
]
const sparkData5 = [
  { value: 800 }, { value: 620 }, { value: 510 }, { value: 480 }, { value: 450 }, { value: 400 }, { value: 380 }
]
const sparkData6 = [
  { value: 92 }, { value: 94 }, { value: 93 }, { value: 96 }, { value: 95 }, { value: 97 }, { value: 98 }
]

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 17 } }
}

const listContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
}

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 120, damping: 18 } }
}

function StatCard({ label, value, icon: Icon, color, glowClass, sparkData, stroke, trend, isLoading }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
  glowClass: string
  sparkData: any[]
  stroke: string
  trend: string
  isLoading: boolean
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className={`glass-panel rounded-2xl p-5 transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-40 border border-slate-200/50 dark:border-slate-800/60 dark:bg-slate-900/40 ${glowClass}`}
    >
      {/* Background soft light highlights */}
      <div className="absolute -right-10 -top-10 w-28 h-28 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/5`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="space-y-2 animate-pulse z-10">
          <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-16 bg-slate-100 dark:bg-slate-850 rounded" />
        </div>
      ) : (
        <div className="flex items-end justify-between z-10">
          <div>
            <p className="text-3.5xl font-black text-slate-850 dark:text-slate-100 tracking-tight leading-none">{value}</p>
            <p className="text-[10px] font-bold text-indigo-650 dark:text-indigo-400 mt-2.5 flex items-center gap-0.5">
              <span>{trend}</span>
              <span className="text-slate-400 dark:text-slate-500 font-medium">vs last month</span>
            </p>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="w-24 h-10 opacity-70 dark:opacity-90">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useQuery<Summary>({
    queryKey: ['analytics-summary'],
    queryFn: () => api.get('/analytics/summary?days=30').then((r) => r.data.data ?? r.data),
    placeholderData: { totalConversations: 0, totalMessages: 0, totalLeads: 0, avgResponseTimeMs: 0 },
  })

  const { data: bots, isLoading: botsLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.get('/bots').then((r) => r.data.data?.items ?? []),
    placeholderData: [],
  })

  const activeBotsCount = (bots as any[])?.filter(b => b.status === 'active').length || 0

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.05 }
        }
      }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
        <div>
          <h1 className="text-3.5xl font-black tracking-tight text-slate-850 dark:text-slate-100">
            Overview
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 font-medium">
            Monitor chatbot interactions, lead metrics, and performance.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-100/50 dark:border-emerald-900/30">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span>Real-time sync active</span>
        </div>
      </div>

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        <StatCard
          label="Conversations"
          value={formatNumber(summary!.totalConversations)}
          icon={MessageSquare}
          color="bg-gradient-to-tr from-blue-600 to-indigo-500"
          glowClass="glow-indigo"
          sparkData={sparkData1}
          stroke="#4F46E5"
          trend="+12.3%"
          isLoading={summaryLoading}
        />
        <StatCard
          label="Messages Sent"
          value={formatNumber(summary!.totalMessages)}
          icon={TrendingUp}
          color="bg-gradient-to-tr from-emerald-500 to-teal-400"
          glowClass="glow-green"
          sparkData={sparkData2}
          stroke="#10B981"
          trend="+8.7%"
          isLoading={summaryLoading}
        />
        <StatCard
          label="Active Bots"
          value={botsLoading ? '...' : activeBotsCount.toString()}
          icon={Bot}
          color="bg-gradient-to-tr from-indigo-500 to-purple-500"
          glowClass="glow-indigo"
          sparkData={sparkData3}
          stroke="#6366F1"
          trend={`${bots?.length || 0} total`}
          isLoading={botsLoading}
        />
        <StatCard
          label="Leads Captured"
          value={formatNumber(summary!.totalLeads)}
          icon={Zap}
          color="bg-gradient-to-tr from-violet-600 to-purple-500"
          glowClass="glow-purple"
          sparkData={sparkData4}
          stroke="#8B5CF6"
          trend="+14.2%"
          isLoading={summaryLoading}
        />
        <StatCard
          label="Avg Response"
          value={formatMs(summary!.avgResponseTimeMs)}
          icon={Clock}
          color="bg-gradient-to-tr from-orange-500 to-amber-400"
          glowClass="glow-orange"
          sparkData={sparkData5}
          stroke="#F97316"
          trend="-5.4%"
          isLoading={summaryLoading}
        />
        <StatCard
          label="User Sat (CSAT)"
          value="98.5%"
          icon={Smile}
          color="bg-gradient-to-tr from-pink-500 to-rose-450"
          glowClass="glow-purple"
          sparkData={sparkData6}
          stroke="#EC4899"
          trend="+0.6%"
          isLoading={summaryLoading}
        />
      </div>

      {/* Main Section: Bots List & Actions panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bots List Column */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden border border-slate-200/50 dark:border-slate-800/40 dark:bg-slate-900/40"
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10">
            <div>
              <h2 className="font-bold text-slate-800 dark:text-slate-150 text-base">Your Active Bots</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Quick status and configuration links</p>
            </div>
            <Link to="/bots" className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1 group transition-colors">
              <span>View all bots</span>
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <motion.div 
            variants={listContainerVariants}
            className="divide-y divide-slate-100 dark:divide-slate-800/60"
          >
            {botsLoading ? (
              <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto" />
              </div>
            ) : (bots as any[]).length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 bg-white/50 dark:bg-transparent">
                <Bot className="w-10 h-10 mx-auto mb-3 opacity-30 text-indigo-500" />
                <p className="text-sm font-semibold">No bots configured yet</p>
                <Link to="/bots" className="text-xs font-bold text-indigo-605 hover:underline mt-2 block">
                  Create your first bot
                </Link>
              </div>
            ) : (
              (bots as any[]).slice(0, 4).map((bot: any) => (
                <motion.div 
                  key={bot.id} 
                  variants={listItemVariants}
                  whileHover={{ backgroundColor: "rgba(248, 250, 252, 0.45)", x: 3 }}
                  className="flex items-center justify-between px-6 py-4.5 transition-all bg-white/40 dark:bg-transparent"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 flex-shrink-0">
                      <Bot className="w-5 h-5 text-indigo-605 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{bot.name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded uppercase tracking-wider text-[9px]">
                          {bot.modelName || 'DeepSeek'}
                        </span>
                        <span>·</span>
                        <span>RAG {bot.ragEnabled ? 'On' : 'Off'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      bot.status === 'active' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                    }`}>
                      {bot.status}
                    </span>
                    <Link
                      to={`/bots/${bot.id}`}
                      className="p-2 bg-slate-50 dark:bg-slate-800/40 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200/40 dark:border-slate-700/30 rounded-xl transition-all"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        </motion.div>

        {/* Quick Tips & Platform Assist Column */}
        <motion.div
          variants={cardVariants}
          className="glass-panel rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/40 dark:bg-slate-900/40 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-150 text-base">Quick Start Guide</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Build a new bot or train an existing assistant by adding document sources to the Knowledge Base.
              </p>
            </div>
            <div className="space-y-3.5 pt-2">
              {[
                { step: '1', title: 'Create Bot profile', to: '/bots' },
                { step: '2', title: 'Upload source docs', to: '/knowledge-base' },
                { step: '3', title: 'Paste widget embed code', to: '/bots' }
              ].map(({ step, title, to }) => (
                <Link key={step} to={to} className="flex items-center gap-3 group text-xs text-slate-650 dark:text-slate-350 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-all">
                  <span className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-750 flex items-center justify-center text-[10px] group-hover:border-indigo-400 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-950/20 transition-all font-bold">
                    {step}
                  </span>
                  <span>{title}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-slate-200/40 dark:border-slate-800/45 mt-4">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">
              Powered by deepseek-v3
            </p>
          </div>
        </motion.div>

      </div>
    </motion.div>
  )
}
