import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Bot, Trash2, ExternalLink, Loader2 } from 'lucide-react'
import api from '@/lib/api'

export default function BotsPage() {
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
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
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bots</h1>
          <p className="text-sm text-gray-500 mt-1">Build and manage your AI chat bots</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          New Bot
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Create new bot</h2>
          <form onSubmit={handleCreate} className="flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bot name (e.g. Support Bot)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Create
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {/* Bot list */}
      <div className="bg-white rounded-xl border border-gray-200">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : bots.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Bot className="w-10 h-10 mb-3 opacity-40" />
            <p className="text-sm">No bots yet. Create your first one above.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bots.map((bot: any) => (
              <div key={bot.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{bot.name}</p>
                    <p className="text-xs text-gray-400">{bot.modelName || 'deepseek-v3'} · {bot.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/bots/${bot.id}`}
                    className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    Configure
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Delete this bot?')) deleteMutation.mutate(bot.id)
                    }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
