import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Loader2, Key, Copy, Eye, EyeOff, Plug, CreditCard, CheckCircle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import api from '@/lib/api'

const INTEGRATION_TYPES = ['slack', 'email', 'zapier', 'crm', 'custom']

export default function SettingsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()

  const [tab, setTab] = useState<'profile' | 'apikeys' | 'integrations' | 'billing'>('profile')
  const [newKeyName, setNewKeyName]   = useState('')
  const [showCreate, setShowCreate]   = useState(false)
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null)
  const [copied, setCopied]           = useState(false)
  const [showKey, setShowKey]         = useState(false)
  const [showAddIntegration, setShowAddIntegration] = useState(false)
  const [newIntegration, setNewIntegration] = useState({ type: 'slack', name: '', config: { url: '' } })

  const { data: keys = [], isLoading: keysLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-keys').then((r) => r.data.data ?? []),
    enabled: tab === 'apikeys',
  })

  const { data: integrations = [], isLoading: intLoading } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => api.get('/integrations').then((r) => r.data.data ?? []),
    enabled: tab === 'integrations',
  })

  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: () => api.get('/subscription').then((r) => r.data.data),
    enabled: tab === 'billing',
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/subscription/plans').then((r) => r.data.data ?? []),
    enabled: tab === 'billing',
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

  const createIntegrationMutation = useMutation({
    mutationFn: (payload: any) => api.post('/integrations', payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['integrations'] }); setShowAddIntegration(false) },
  })

  const deleteIntegrationMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/integrations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['integrations'] }),
  })

  const upgradeMutation = useMutation({
    mutationFn: (planId: string) => api.post('/subscription/upgrade', { planId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  })

  const cancelMutation = useMutation({
    mutationFn: () => api.post('/subscription/cancel'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscription'] }),
  })

  const copyKey = async (val: string) => {
    await navigator.clipboard.writeText(val)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const TABS = [
    { id: 'profile',      label: 'Profile' },
    { id: 'apikeys',      label: 'API Keys' },
    { id: 'integrations', label: 'Integrations' },
    { id: 'billing',      label: 'Billing' },
  ] as const

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your workspace</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
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
          <div className="mt-3 bg-gray-50 rounded-lg p-3 font-mono text-xs text-gray-600">
            Authorization: Bearer &lt;access_token&gt;
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'apikeys' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-gray-900">API Keys</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Use <code className="bg-gray-100 px-1 rounded text-xs">X-API-Key: cp_…</code> to
                authenticate API calls from your backend without a user JWT.
              </p>
            </div>
            <button onClick={() => { setShowCreate(true); setNewKeyValue(null) }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> New Key
            </button>
          </div>

          {showCreate && (
            <div className="mb-4 flex gap-2">
              <input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="Key name (e.g. My Integration)" autoFocus
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button onClick={() => createMutation.mutate(newKeyName || 'API Key')}
                disabled={createMutation.isPending}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">
                {createMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Create
              </button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                Cancel
              </button>
            </div>
          )}

          {newKeyValue && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-700 font-medium mb-1.5">Copy this key now — it won't be shown again.</p>
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

          {keysLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
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
                  <button onClick={() => { if (confirm(`Revoke key "${k.name}"?`)) revokeMutation.mutate(k.id) }}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Integrations Tab */}
      {tab === 'integrations' && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Plug className="w-4 h-4 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Integrations</h2>
            </div>
            <button onClick={() => setShowAddIntegration(true)}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {showAddIntegration && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Type</label>
                  <select value={newIntegration.type}
                    onChange={(e) => setNewIntegration(i => ({ ...i, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {INTEGRATION_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Name</label>
                  <input value={newIntegration.name}
                    onChange={(e) => setNewIntegration(i => ({ ...i, name: e.target.value }))}
                    placeholder="My Slack workspace"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Webhook / URL</label>
                <input value={newIntegration.config.url}
                  onChange={(e) => setNewIntegration(i => ({ ...i, config: { url: e.target.value } }))}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => createIntegrationMutation.mutate(newIntegration)}
                  disabled={!newIntegration.name || createIntegrationMutation.isPending}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">
                  {createIntegrationMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Save
                </button>
                <button onClick={() => setShowAddIntegration(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">Cancel</button>
              </div>
            </div>
          )}

          {intLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
          ) : (integrations as any[]).length === 0 && !showAddIntegration ? (
            <div className="text-center py-8 text-gray-400">
              <Plug className="w-7 h-7 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No integrations yet. Connect Slack, email, or a custom webhook.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {(integrations as any[]).map((i: any) => (
                <div key={i.id} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Plug className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{i.name}</p>
                    <p className="text-xs text-gray-400">{i.type} · {i.status}</p>
                  </div>
                  <button onClick={() => { if (confirm(`Delete "${i.name}"?`)) deleteIntegrationMutation.mutate(i.id) }}
                    className="p-1.5 text-gray-300 hover:text-red-400 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Billing Tab */}
      {tab === 'billing' && (
        <div className="space-y-4">
          {/* Current plan */}
          {subscription && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <h2 className="font-semibold text-gray-900">Current Plan</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-gray-900 capitalize">{subscription.planId}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  subscription.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>{subscription.status}</span>
              </div>
              {subscription.currentPeriodEnd && (
                <p className="text-xs text-gray-400 mt-1">
                  {subscription.cancelAtPeriodEnd ? 'Cancels' : 'Renews'} on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              )}
              {!subscription.cancelAtPeriodEnd && subscription.planId !== 'free' && (
                <button onClick={() => { if (confirm('Cancel subscription?')) cancelMutation.mutate() }}
                  disabled={cancelMutation.isPending}
                  className="mt-3 text-xs text-red-500 hover:text-red-700 disabled:opacity-50">
                  Cancel subscription
                </button>
              )}
            </div>
          )}

          {/* Plan cards */}
          <div className="grid grid-cols-2 gap-3">
            {(plans as any[]).map((plan: any) => (
              <div key={plan.id} className={`bg-white rounded-xl border p-4 ${
                subscription?.planId === plan.id ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-900">{plan.name}</span>
                  {subscription?.planId === plan.id && (
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <p className="text-xl font-bold text-gray-900">
                  ${plan.price}<span className="text-xs font-normal text-gray-400">/mo</span>
                </p>
                <ul className="text-xs text-gray-500 mt-2 space-y-1">
                  <li>{plan.messages === -1 ? 'Unlimited' : plan.messages.toLocaleString()} messages</li>
                  <li>{plan.bots === -1 ? 'Unlimited' : plan.bots} bots</li>
                  <li>{plan.members === -1 ? 'Unlimited' : plan.members} members</li>
                </ul>
                {subscription?.planId !== plan.id && (
                  <button onClick={() => upgradeMutation.mutate(plan.id)}
                    disabled={upgradeMutation.isPending}
                    className="mt-3 w-full py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
                    {upgradeMutation.isPending ? 'Upgrading…' : 'Switch to ' + plan.name}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
