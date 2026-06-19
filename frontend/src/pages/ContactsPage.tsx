import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, Search, Loader2, ChevronDown, Clock, Plus, Phone, Mail, Building, Tag, Calendar, Trash2 } from 'lucide-react'
import api from '@/lib/api'

const ACTIVITY_COLORS: Record<string, string> = {
  note:        'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-105/50',
  call:        'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-105/50',
  email:       'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-105/50',
  chat:        'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-105/50',
  stage_change:'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-105/50',
}

const STAGES = ['new', 'qualified', 'converted', 'lost']

const STAGE_COLORS: Record<string, string> = {
  new:       'bg-blue-55/10 text-blue-600 dark:text-blue-400 border-blue-200/30',
  qualified: 'bg-amber-55/10 text-amber-600 dark:text-amber-400 border-amber-200/30',
  converted: 'bg-emerald-55/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/30',
  lost:      'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-205/30',
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [activityTab, setActivityTab] = useState<'details' | 'activity'>('details')
  const [newNote, setNewNote] = useState('')
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

  const { data: activities = [] } = useQuery({
    queryKey: ['contact-activities', selected?.id],
    queryFn: () => api.get(`/contacts/${selected.id}/activities`).then((r) => r.data.data?.items ?? []),
    enabled: !!selected?.id && activityTab === 'activity',
  })

  const addActivityMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/contacts/${selected.id}/activities`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contact-activities', selected.id] })
      setNewNote('')
    },
  })

  const s: any = stats ?? {}
  const list: any[] = (contacts as any[]) ?? []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
        <h1 className="text-3.5xl font-black tracking-tight text-slate-850 dark:text-slate-100">Contacts</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Leads and contacts captured automatically from conversations</p>
      </div>

      {/* Stage summary pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const isFilterActive = stageFilter === stage
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stageFilter === stage ? '' : stage)}
              className={`glass-panel dark:bg-slate-900/40 rounded-2xl p-4 text-left transition-all border ${
                isFilterActive
                  ? 'border-indigo-650 ring-1 ring-indigo-500/20 shadow-md'
                  : 'border-slate-200/50 dark:border-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">{stage}</p>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight leading-none">{s[stage] ?? 0}</p>
            </button>
          )
        })}
      </div>

      {/* Workspace panel split */}
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* Contacts List panel */}
        <div className="flex-1 w-full bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden shadow-sm">
          {/* Search bar */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-850/80 bg-slate-50/50 dark:bg-slate-900/10">
            <Search className="w-4.5 h-4.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or company..."
              className="flex-1 text-xs outline-none bg-transparent text-slate-750 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          <div className="divide-y divide-slate-150/40 dark:divide-slate-800/40">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : list.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400 dark:text-slate-550 text-center px-4 bg-white/40 dark:bg-transparent">
                <Users className="w-10 h-10 mb-3 opacity-20 text-indigo-505" />
                <p className="text-xs font-bold">No contacts found</p>
              </div>
            ) : (
              list.map((c: any) => {
                const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || c.email || '—'
                const initials = name.slice(0, 2).toUpperCase()
                const isActive = selected?.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={`w-full text-left flex items-center justify-between px-5 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors border-l-2 ${
                      isActive 
                        ? 'bg-indigo-50/10 dark:bg-indigo-500/5 border-indigo-650' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Initials Avatar */}
                      <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">{name}</p>
                        <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-semibold truncate">
                          {c.email || c.phone || c.company || '—'}
                        </p>
                      </div>
                    </div>
                    
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${STAGE_COLORS[c.stage] ?? ''}`}>
                      {c.stage}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Contact Details Pane (Right) */}
        {selected && (
          <div className="w-full lg:w-80 bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex-shrink-0 flex flex-col overflow-hidden shadow-sm">
            {/* Header info */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/10 flex-shrink-0">
              <h2 className="font-bold text-slate-850 dark:text-slate-100 text-xs truncate">
                {[selected.firstName, selected.lastName].filter(Boolean).join(' ') || 'Lead Details'}
              </h2>
              <button 
                onClick={() => setSelected(null)} 
                className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-450 hover:text-slate-700 dark:hover:text-slate-200 font-bold"
              >
                CLOSE
              </button>
            </div>

            {/* Sub-tabs selectors */}
            <div className="flex border-b border-slate-105 dark:border-slate-800/60 p-1 bg-slate-50/30 dark:bg-slate-950/10">
              {(['details', 'activity'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActivityTab(t)}
                  className={`flex-1 py-2 text-center text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                    activityTab === t 
                      ? 'bg-white dark:bg-slate-800 text-indigo-650 dark:text-indigo-400 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Content pane */}
            <div className="p-5 space-y-5 overflow-y-auto max-h-[360px]">
              {activityTab === 'details' ? (
                <div className="space-y-4">
                  {/* Stage selector details */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Lead Stage</label>
                    <div className="relative">
                      <select
                        value={selected.stage}
                        onChange={(e) => {
                          const newStage = e.target.value
                          setSelected({ ...selected, stage: newStage })
                          updateMutation.mutate({ id: selected.id, data: { stage: newStage } })
                        }}
                        className="w-full appearance-none text-xs border border-slate-205 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 rounded-xl px-3 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-150 font-bold"
                      >
                        {STAGES.map((st) => <option key={st} value={st} className="capitalize dark:bg-slate-900">{st}</option>)}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-3.5 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Details metadata */}
                  {[
                    { label: 'Email',   value: selected.email, icon: Mail },
                    { label: 'Phone',   value: selected.phone, icon: Phone },
                    { label: 'Company', value: selected.company, icon: Building },
                    { label: 'Source',  value: selected.source, icon: Tag },
                    { label: 'Lead Score',   value: selected.score !== undefined ? `${selected.score}/100` : null, icon: Calendar },
                  ].map(({ label, value, icon: Icon }) =>
                    value ? (
                      <div key={label} className="flex gap-2">
                        <Icon className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1">{value}</p>
                        </div>
                      </div>
                    ) : null
                  )}

                  {selected.notes && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Internal Notes</p>
                      <p className="text-xs text-slate-650 dark:text-slate-350 mt-1 leading-relaxed whitespace-pre-wrap bg-slate-50/40 dark:bg-slate-900/20 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800/30">
                        {selected.notes}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => { if (confirm('Delete this contact?')) deleteMutation.mutate(selected.id) }}
                    className="w-full flex items-center justify-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-bold py-2.5 border border-red-200/50 hover:bg-red-50/50 dark:hover:bg-red-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Contact</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Add note timeline form */}
                  <div className="flex gap-2">
                    <input
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add activity note..."
                      className="flex-1 px-3 py-2 bg-slate-50/55 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-100"
                    />
                    <button
                      onClick={() => addActivityMutation.mutate({ type: 'note', summary: newNote })}
                      disabled={!newNote.trim() || addActivityMutation.isPending}
                      className="p-2.5 bg-indigo-650 text-white rounded-xl disabled:opacity-40 transition-colors shadow-md flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Timeline listing */}
                  {activities.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-550">
                      <Clock className="w-6 h-6 mx-auto mb-2 opacity-20" />
                      <p className="text-xs font-semibold">No activity logs recorded</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {activities.map((a: any) => (
                        <div key={a.id} className="p-3 bg-slate-50/50 dark:bg-slate-900/10 rounded-xl border border-slate-100 dark:border-slate-800/40 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between gap-1 flex-wrap">
                            <span className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border ${ACTIVITY_COLORS[a.type] || 'bg-slate-105 text-slate-500'}`}>
                              {a.type}
                            </span>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">{a.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
