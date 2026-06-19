import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Loader2, Key, Copy, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [newKeyName, setNewKeyName]   = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [showKey, setShowKey]         = useState(false)

  const { data: keys = [], isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-keys').then((r) => r.data.data ?? []),
  })

  const createMutation = useMutation({
    mutationFn: (name: string) => api.post('/api-keys', { name }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['api-keys'] })
      setNewKeyValue(res.data.data?.key ?? null)
      setShowCreate(false)
      setNewKeyName('')
    },
  })

  const revokeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  })

  const copyKey = async (val: string) => {
    await navigator.clipboard.writeText(val)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account</p>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-900">Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
            <p className="text-sm text-gray-900">{user?.name || '—'}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
            <p className="text-sm text-gray-900">{user?.email || '—'}</p>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">API Keys</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Use <code className="bg-gray-100 px-1 rounded text-xs">X-API-Key: cp_…</code> to
              authenticate API calls from your backend without a user JWT.
            </p>
          </div>
          <button
            onClick={() => { setShowCreate(true); setNewKeyValue(null) }}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> New Key
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="mb-4 flex gap-2">
            <input
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Key name (e.g. My Integration)"
              autoFocus
              className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => createMutation.mutate(newKeyName || 'API Key')}
              disabled={createMutation.isPending}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
            >
              {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Create
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
          </div>
        )}

        {/* New key reveal — shown once */}
        {newKeyValue && (
          <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-700 font-medium mb-1.5">
              Copy this key now — it won't be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs font-mono text-green-900 break-all">
                {showKey ? newKeyValue : newKeyValue.slice(0, 12) + '•'.repeat(20)}
              </code>
              <button onClick={() => setShowKey((v) => !v)} className="text-green-600">
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button onClick={() => copyKey(newKeyValue)} className="text-green-600">
                <Copy className="w-4 h-4" />
              </button>
              {copied && <span className="text-xs text-green-700">Copied!</span>}
            </div>
          </div>
        )}

        {/* Key list */}
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          </div>
        ) : (keys as any[]).length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Key className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No API keys yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(keys as any[]).map((k: any) => (
              <div key={k.id} className="flex items-center gap-3 py-3">
                <Key className="w-4 h-4 text-gray-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{k.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{k.prefix}…</p>
                </div>
                <span className="text-xs text-gray-400">
                  {k.lastUsedAt ? `Last used ${new Date(k.lastUsedAt).toLocaleDateString()}` : 'Never used'}
                </span>
                <button
                  onClick={() => {
                    if (confirm(`Revoke key "${k.name}"? This cannot be undone.`)) {
                      revokeMutation.mutate(k.id)
                    }
                  }}
                  className="p-1.5 text-gray-300 hover:text-red-400 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* JWT info */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-2">Bearer Token (JWT)</h2>
        <p className="text-sm text-gray-500">
          For browser-based or short-lived calls, attach your JWT as a Bearer token. Tokens
          expire after 15 minutes — use the refresh endpoint to renew.
        </p>
        <div className="mt-3 bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600">
          Authorization: Bearer &lt;access_token&gt;
        </div>
      </div>
    </div>
  )
}
