import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { formatNumber, formatMs } from '@/lib/utils'
import { MessageSquare, Zap, Clock, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

const RANGES = [
  { label: '7 days',  days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
]

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const toDate = new Date().toISOString().split('T')[0]
  const fromDate = new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0]

  const { data: summary } = useQuery({
    queryKey: ['analytics-summary', days],
    queryFn: () => api.get(`/analytics/summary?days=${days}`).then((r) => r.data.data ?? r.data),
    placeholderData: {},
  })

  const { data: timeseries } = useQuery({
    queryKey: ['analytics-timeseries', days],
    queryFn: () =>
      api.get(`/analytics/timeseries?from=${fromDate}&to=${toDate}`).then((r) => r.data.data ?? r.data),
    placeholderData: [],
  })

  const ts: any[] = (timeseries as any[]) ?? []
  const s: any = summary ?? {}

  const statCards = [
    { label: 'Conversations', value: formatNumber(s.totalConversations ?? 0), icon: MessageSquare, color: 'text-blue-650 dark:text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Messages Sent', value: formatNumber(s.totalMessages ?? 0), icon: TrendingUp, iconColor: 'text-emerald-500', color: 'text-emerald-650 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Leads Captured', value: formatNumber(s.totalLeads ?? 0), icon: Zap, iconColor: 'text-purple-500', color: 'text-purple-650 dark:text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Avg Response', value: formatMs(s.avgResponseTimeMs ?? 0), icon: Clock, iconColor: 'text-orange-500', color: 'text-orange-655 dark:text-orange-400', bg: 'bg-orange-500/10' },
  ]

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1E293B] border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl shadow-xl">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <span>{p.name}: {p.value}</span>
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
        <div>
          <h1 className="text-3.5xl font-black tracking-tight text-slate-850 dark:text-slate-100">Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Performance overview of your AI assistants</p>
        </div>
        <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1.5 rounded-xl border border-slate-200/40 dark:border-slate-800/30 self-start sm:self-auto">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-150 ${
                days === r.days
                  ? 'bg-white dark:bg-[#1E293B] text-slate-900 dark:text-slate-105 shadow-sm'
                  : 'text-slate-500 dark:text-slate-450 hover:text-slate-805 dark:hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((c) => {
          const Icon = c.icon
          return (
            <div key={c.label} className="glass-panel rounded-2xl p-5 dark:bg-slate-900/40">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-550 mb-3">
                <Icon className="w-4.5 h-4.5" />
                <span className="text-xs font-semibold uppercase tracking-wider">{c.label}</span>
              </div>
              <p className={`text-2.5xl font-black tracking-tight ${c.color}`}>{c.value}</p>
            </div>
          )
        })}
      </div>

      {/* Charts area */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Conversations chart */}
        <div className="glass-panel rounded-2xl p-6 dark:bg-slate-900/40">
          <div className="mb-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-150 text-base">Conversations Over Time</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Total sessions processed in the selected range</p>
          </div>
          <div className="w-100 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ts} margin={{ left: -10, right: 10, top: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} border-0 />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="conversations" stroke="#6366F1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorConv)" name="Conversations" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Messages bar chart */}
        <div className="glass-panel rounded-2xl p-6 dark:bg-slate-900/40">
          <div className="mb-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-150 text-base">Messages by Day</h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Message breakdown between user inputs and bot replies</p>
          </div>
          <div className="w-100 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ts} margin={{ left: -10, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.08)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="messagesUser" name="User messages" fill="#818CF8" radius={[4, 4, 0, 0]} maxBarSize={16} />
                <Bar dataKey="messagesBot" name="Bot responses" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  )
}
