import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'
import { formatNumber, formatMs } from '@/lib/utils'
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Performance overview</p>
        </div>
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === r.days
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversations',  value: formatNumber(s.totalConversations ?? 0), color: 'text-blue-600' },
          { label: 'Messages',       value: formatNumber(s.totalMessages ?? 0),       color: 'text-green-600' },
          { label: 'Leads',          value: formatNumber(s.totalLeads ?? 0),           color: 'text-purple-600' },
          { label: 'Avg Response',   value: formatMs(s.avgResponseTimeMs ?? 0),        color: 'text-orange-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm text-gray-500 mb-2">{label}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Conversations chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Conversations over time</h2>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={ts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="conversations" stroke="#3b82f6" strokeWidth={2} dot={false} name="Conversations" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Messages bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Messages by day</h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={ts}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="messagesUser" name="User"   fill="#93c5fd" />
            <Bar dataKey="messagesBot"  name="Bot"    fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
