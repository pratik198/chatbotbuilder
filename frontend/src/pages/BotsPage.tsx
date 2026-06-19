import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Bot, Trash2, ArrowRight, Loader2, Sparkles } from 'lucide-react'
import api from '@/lib/api'

export default function BotsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [createError, setCreateError] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['bots'],
    queryFn: () => api.get('/bots').then((r) => r.data.data?.items ?? r.data.data ?? []),
    placeholderData: [],
  })

  const bots: any[] = data ?? []

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/bots', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bots'] })
      setShowCreate(false)
      setName('')
      setCreateError('')
    },
    onError: (err: any) => {
      setCreateError(err?.response?.data?.error?.message || 'Failed to create bot. Please try again.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bots/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bots'] }),
  })

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createMutation.mutate({ name: name.trim() })
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
        <div>
          <h1 className="text-3.5xl font-black tracking-tight text-slate-850 dark:text-slate-100">Bots</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Build, manage, and configure your AI assistants</p>
        </div>
        {!showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-550/10 transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>Create Bot</span>
          </button>
        )}
      </div>

      {/* Create form drawer panel */}
      {showCreate && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-150 dark:border-slate-800/60 dark:bg-slate-900/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 w-40 h-40 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4.5 h-4.5 text-indigo-505" />
            <h2 className="font-bold text-slate-805 dark:text-slate-100 text-sm">Create New Assistant</h2>
          </div>

          {createError && (
            <div className="mb-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="flex flex-col sm:flex-row gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Support Bot"
              className="flex-1 px-4 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-100"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-xs font-bold disabled:opacity-50 transition-all duration-150"
              >
                {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create Bot</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bot card grid */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : bots.length === 0 ? (
          <div className="glass-panel rounded-2xl flex flex-col items-center py-20 text-slate-400 dark:text-slate-550 border border-slate-200/50 dark:border-slate-800/40 dark:bg-slate-900/40">
            <Bot className="w-12 h-12 mb-4 opacity-30 text-indigo-500" />
            <p className="text-sm font-semibold">No assistants configured yet</p>
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-1">Get started by creating your first bot above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot: any) => {
              const botInitials = bot.name?.slice(0, 2).toUpperCase() || 'AI'
              return (
                <div 
                  key={bot.id} 
                  className="glass-panel dark:bg-slate-900/40 hover:glow-indigo dark:hover:border-indigo-500/20 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/40 flex flex-col justify-between h-56 transition-all duration-300 relative group"
                >
                  {/* Glowing line overlay */}
                  <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-550/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Top card section */}
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      {/* Avatar */}
                      <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-650 dark:text-indigo-400 font-bold text-sm">
                        {botInitials}
                      </div>

                      {/* Status badge */}
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        bot.status === 'active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50'
                      }`}>
                        {bot.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-850 dark:text-slate-100 text-[15px] truncate">{bot.name}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-semibold flex items-center gap-1.5">
                      <span className="bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded uppercase tracking-wider text-[9px] text-slate-500 dark:text-slate-400">
                        {bot.modelName || 'deepseek-v3'}
                      </span>
                      <span>·</span>
                      <span>RAG {bot.ragEnabled ? 'Enabled' : 'Disabled'}</span>
                    </p>
                  </div>

                  {/* Actions footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/40 mt-4">
                    <Link
                      to={`/bots/${bot.id}`}
                      className="flex items-center gap-1.5 text-xs text-indigo-650 dark:text-indigo-400 hover:text-indigo-805 dark:hover:text-indigo-350 font-bold transition-all group/btn"
                    >
                      <span>Configure</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                    </Link>

                    <button
                      onClick={() => {
                        if (confirm('Delete this bot?')) deleteMutation.mutate(bot.id)
                      }}
                      className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50/50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                      title="Delete bot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
