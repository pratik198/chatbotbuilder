import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Bot, TrendingUp, Zap, Clock } from 'lucide-react'
import { formatNumber, formatMs } from '@/lib/utils'
import api from '@/lib/api'

interface Summary {
  totalConversations: number
  totalMessages: number
  totalLeads: number
  avgResponseTimeMs: number
}

function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Last 30 days</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Conversations"
          value={isLoading ? '...' : formatNumber(summary!.totalConversations)}
          icon={MessageSquare}
          color="bg-blue-500"
        />
        <StatCard
          label="Messages"
          value={isLoading ? '...' : formatNumber(summary!.totalMessages)}
          icon={TrendingUp}
          color="bg-green-500"
        />
        <StatCard
          label="Leads Captured"
          value={isLoading ? '...' : formatNumber(summary!.totalLeads)}
          icon={Zap}
          color="bg-purple-500"
        />
        <StatCard
          label="Avg Response"
          value={isLoading ? '...' : formatMs(summary!.avgResponseTimeMs)}
          icon={Clock}
          color="bg-orange-500"
        />
      </div>

      {/* Bots list */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Your Bots</h2>
          <a href="/bots" className="text-sm text-blue-600 hover:underline">View all</a>
        </div>
        <div className="divide-y divide-gray-100">
          {(bots as any[]).length === 0 ? (
            <div className="px-5 py-8 text-center text-gray-400">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No bots yet. <a href="/bots" className="text-blue-600 hover:underline">Create your first bot</a></p>
            </div>
          ) : (
            (bots as any[]).slice(0, 5).map((bot: any) => (
              <div key={bot.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Bot className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bot.name}</p>
                    <p className="text-xs text-gray-400">{bot.modelName}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  bot.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {bot.status}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
