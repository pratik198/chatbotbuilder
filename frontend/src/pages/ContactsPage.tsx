import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Plus, Loader2, ChevronDown } from 'lucide-react'
import api from '@/lib/api'

const STAGES = ['new', 'qualified', 'converted', 'lost']

const STAGE_COLORS: Record<string, string> = {
  new:       'bg-blue-100 text-blue-700',
  qualified: 'bg-yellow-100 text-yellow-700',
  converted: 'bg-green-100 text-green-700',
  lost:      'bg-gray-100 text-gray-500',
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['contact-stats'],
    queryFn: () => api.get('/contacts/stats').then((r) => r.data.data),
    placeholderData: {},
  })

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', search, stageFilter],
    queryFn: () => {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (stageFilter) params.set('stage', stageFilter)
      return api.get(`/contacts?${params}`).then((r) => r.data.data?.items ?? [])
    },
    placeholderData: [],
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/contacts/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-stats'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/contacts/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] })
      qc.invalidateQueries({ queryKey: ['contact-stats'] })
      setSelected(null)
    },
  })

  const s: any = stats ?? {}
  const list: any[] = (contacts as any[]) ?? []

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">Leads captured from your chatbots</p>
        </div>
      </div>

      {/* Stage summary */}
      <div className="grid grid-cols-4 gap-3">
        {STAGES.map((stage) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
            className={`bg-white rounded-xl border px-4 py-3 text-left transition-shadow hover:shadow-sm ${
              stageFilter === stage ? 'border-blue-400 ring-1 ring-blue-400' : 'border-gray-200'
            }`}
          >
            <p className="text-xs text-gray-400 capitalize mb-1">{stage}</p>
            <p className="text-xl font-bold text-gray-900">{s[stage] ?? 0}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-4">
        {/* List */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Search bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or company..."
              className="flex-1 text-sm outline-none text-gray-700 placeholder-gray-400"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <Users className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">No contacts yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {list.map((c: any) => {
                const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '—'
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left flex items-center justify-between px-4 py-3 hover:bg-gray-50 ${
                      selected?.id === c.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-semibold flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{name}</p>
                        <p className="text-xs text-gray-400">{c.email || c.phone || c.company || '—'}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${STAGE_COLORS[c.stage] ?? ''}`}>
                      {c.stage}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-72 bg-white rounded-xl border border-gray-200 p-5 space-y-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">
                {[selected.firstName, selected.lastName].filter(Boolean).join(' ') || 'Contact'}
              </h2>
              <button
                onClick={() => setSelected(null)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>

            {/* Stage selector */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Stage</label>
              <div className="relative">
                <select
                  value={selected.stage}
                  onChange={(e) => {
                    const newStage = e.target.value
                    setSelected({ ...selected, stage: newStage })
                    updateMutation.mutate({ id: selected.id, data: { stage: newStage } })
                  }}
                  className="w-full appearance-none text-sm border border-gray-200 rounded-lg px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* Fields */}
            {[
              { label: 'Email',   value: selected.email },
              { label: 'Phone',   value: selected.phone },
              { label: 'Company', value: selected.company },
              { label: 'Source',  value: selected.source },
              { label: 'Score',   value: selected.score !== undefined ? `${selected.score}/100` : null },
            ].map(({ label, value }) =>
              value ? (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-400">{label}</p>
                  <p className="text-sm text-gray-800 mt-0.5">{value}</p>
                </div>
              ) : null
            )}

            {selected.notes && (
              <div>
                <p className="text-xs font-medium text-gray-400">Notes</p>
                <p className="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{selected.notes}</p>
              </div>
            )}

            <button
              onClick={() => {
                if (confirm('Delete this contact?')) deleteMutation.mutate(selected.id)
              }}
              className="w-full text-sm text-red-500 hover:text-red-700 py-2 border border-red-200 rounded-lg hover:bg-red-50 mt-2"
            >
              Delete contact
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
