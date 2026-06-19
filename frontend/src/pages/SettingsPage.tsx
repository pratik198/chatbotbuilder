import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, Plus, Loader2, Key, Copy, Eye, EyeOff, Plug, CreditCard, CheckCircle, ArrowUpRight, Check } from 'lucide-react'
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
    <div className="max-w-3xl space-y-6">
      
      {/* Header bar */}
      <div className="border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
        <h1 className="text-3.5xl font-black tracking-tight text-slate-850 dark:text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">Configure workspace, api keys, and integrations</p>
      </div>

      {/* Tab bar selection */}
      <div className="flex border-b border-slate-200/50 dark:border-slate-800/40 p-1 bg-slate-100/50 dark:bg-slate-905/30 rounded-xl max-w-md">
        {TABS.map((t) => (
          <button 
            key={t.id} 
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
              tab === t.id
                ? 'bg-white dark:bg-[#1E293B] text-indigo-650 dark:text-indigo-400 shadow-sm'
                : 'text-slate-505 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-205'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div className="glass-panel dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm space-y-5">
          <div className="flex items-center gap-2 mb-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Account details</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Name</label>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-150 mt-1.5">{user?.name || '—'}</p>
            </div>
            <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10">
              <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</label>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-150 mt-1.5">{user?.email || '—'}</p>
            </div>
          </div>
          
          <div className="pt-2">
            <label className="block text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider mb-2">Development Access Credentials</label>
            <div className="bg-slate-900 dark:bg-slate-950 text-slate-350 font-mono text-xs rounded-xl p-4 border border-slate-800">
              Authorization: Bearer &lt;access_token&gt;
            </div>
          </div>
        </div>
      )}

      {/* API Keys Tab */}
      {tab === 'apikeys' && (
        <div className="glass-panel dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-805 dark:text-slate-200 text-sm">REST API Keys</h2>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1 max-w-md leading-relaxed">
                Use <code className="bg-slate-100 dark:bg-slate-850 px-1.5 py-0.5 rounded font-mono text-[10px]">X-API-Key: cp_…</code> headers to authorize external script services.
              </p>
            </div>
            {!showCreate && (
              <button 
                onClick={() => { setShowCreate(true); setNewKeyValue(null) }}
                className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-550/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Key</span>
              </button>
            )}
          </div>

          {showCreate && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/60 dark:border-slate-850 flex flex-col sm:flex-row gap-3">
              <input 
                value={newKeyName} 
                onChange={(e) => setNewKeyName(e.target.value)}
                placeholder="e.g. CI/CD Integration Key" 
                autoFocus
                className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-100" 
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => createMutation.mutate(newKeyName || 'API Key')}
                  disabled={createMutation.isPending}
                  className="flex items-center justify-center gap-1 bg-indigo-650 hover:bg-indigo-755 text-white px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {createMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Generate</span>
                </button>
                <button 
                  onClick={() => setShowCreate(false)} 
                  className="px-3 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {newKeyValue && (
            <div className="bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-250 dark:border-emerald-900/30 rounded-2xl p-4 flex flex-col gap-2">
              <p className="text-[10px] text-emerald-805 dark:text-emerald-400 font-bold uppercase tracking-wider">Key generated successfully — Copy now, it will not be shown again.</p>
              <div className="flex items-center gap-3 bg-white dark:bg-slate-900/50 px-3.5 py-2.5 border border-emerald-100 dark:border-emerald-900/10 rounded-xl">
                <code className="flex-1 text-xs font-mono text-emerald-900 dark:text-emerald-305 break-all">
                  {showKey ? newKeyValue : newKeyValue.slice(0, 12) + '•'.repeat(24)}
                </code>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setShowKey((v) => !v)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyKey(newKeyValue)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-lg">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {keysLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : keys.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-550">
              <Key className="w-8 h-8 mx-auto mb-2 opacity-25" />
              <p className="text-xs font-semibold">No active API keys found</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/40">
              {keys.map((k: any) => (
                <div key={k.id} className="flex items-center justify-between py-4 bg-white dark:bg-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-50 dark:bg-slate-850 rounded-xl flex items-center justify-center border border-slate-150/40 dark:border-slate-800 text-slate-500">
                      <Key className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-150">{k.name}</p>
                      <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 font-mono">
                        Key ID: {k.id.slice(0, 8)}... · Created {new Date(k.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('Revoke this API Key?')) revokeMutation.mutate(k.id) }}
                    className="p-2 text-slate-350 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850"
                    title="Revoke key"
                  >
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
        <div className="glass-panel dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-slate-805 dark:text-slate-205 text-sm">Workspace Integrations</h2>
              <p className="text-[11px] text-slate-450 dark:text-slate-500 mt-1">Connect chat widgets to external systems like Slack or Zapier</p>
            </div>
            {!showAddIntegration && (
              <button 
                onClick={() => setShowAddIntegration(true)}
                className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-550/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Integration</span>
              </button>
            )}
          </div>

          {showAddIntegration && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Integration Name</label>
                  <input 
                    value={newIntegration.name} 
                    onChange={(e) => setNewIntegration(a => ({ ...a, name: e.target.value }))}
                    placeholder="Slack Notifications" 
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-100" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Integration Type</label>
                  <select 
                    value={newIntegration.type} 
                    onChange={(e) => setNewIntegration(a => ({ ...a, type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-200"
                  >
                    {INTEGRATION_TYPES.map(t => <option key={t} value={t} className="dark:bg-slate-900">{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Configuration Webhook URL</label>
                <input 
                  value={newIntegration.config.url}
                  onChange={(e) => setNewIntegration(a => ({ ...a, config: { url: e.target.value } }))}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-100" 
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => createIntegrationMutation.mutate(newIntegration)}
                  disabled={!newIntegration.name || !newIntegration.config.url || createIntegrationMutation.isPending}
                  className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {createIntegrationMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Integration</span>
                </button>
                <button 
                  onClick={() => setShowAddIntegration(false)} 
                  className="px-3 py-2 rounded-xl text-xs font-bold text-slate-550 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {intLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
          ) : integrations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 dark:text-slate-550">
              <Plug className="w-8 h-8 mx-auto mb-2 opacity-25" />
              <p className="text-xs font-semibold">No integrations connected</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {integrations.map((item: any) => (
                <div key={item.id} className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800/80 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-100/50 dark:border-indigo-900/30 text-indigo-650">
                      <Plug className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-150">{item.name}</p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">{item.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteIntegrationMutation.mutate(item.id)}
                    className="p-2 text-slate-350 hover:text-red-505 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-850"
                  >
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
        <div className="space-y-6">
          {/* Current plan detail card */}
          {subscription && (
            <div className="glass-panel dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center border border-indigo-105/50 dark:border-indigo-900/20 text-indigo-650">
                  <CreditCard className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Current Plan</span>
                    <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border border-emerald-100/50 dark:border-emerald-900/25 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Active</span>
                  </div>
                  <p className="text-lg font-black text-slate-800 dark:text-slate-150 mt-1">{subscription.planName || 'Free Sandbox Tier'}</p>
                </div>
              </div>

              {subscription.planId !== 'free' && (
                <button
                  onClick={() => { if (confirm('Cancel your plan subscription?')) cancelMutation.mutate() }}
                  disabled={cancelMutation.isPending}
                  className="px-4 py-2.5 rounded-xl border border-red-200/60 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-950/15 text-xs font-bold transition-all disabled:opacity-50"
                >
                  {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          )}

          {/* Pricing Upgrade Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p: any) => {
              const active = subscription?.planId === p.id
              return (
                <div 
                  key={p.id} 
                  className={`glass-panel rounded-2xl p-5 border flex flex-col justify-between h-80 relative overflow-hidden transition-all duration-300 ${
                    active 
                      ? 'border-indigo-600 dark:bg-slate-900/40 ring-1 ring-indigo-500/10 shadow-lg' 
                      : 'border-slate-200/50 dark:border-slate-800/45 dark:bg-slate-900/20 hover:border-slate-300 dark:hover:border-slate-750'
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 capitalize">{p.name}</h3>
                    <div className="flex items-baseline mt-4">
                      <span className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">${p.price}</span>
                      <span className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase ml-1">/ month</span>
                    </div>

                    <div className="space-y-2 mt-5">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350 text-[11px] font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-550 flex-shrink-0" />
                        <span>Up to {p.features?.botsCount || '1'} bot profiles</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350 text-[11px] font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-550 flex-shrink-0" />
                        <span>{p.features?.leadsCount || '50'} leads per month</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350 text-[11px] font-semibold">
                        <CheckCircle className="w-3.5 h-3.5 text-indigo-550 flex-shrink-0" />
                        <span>Custom webhooks integrations</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => upgradeMutation.mutate(p.id)}
                    disabled={active || upgradeMutation.isPending}
                    className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 ${
                      active
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-450 dark:text-slate-500 cursor-default'
                        : 'bg-indigo-650 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/5 disabled:opacity-50'
                    }`}
                  >
                    {active ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Current Tier</span>
                      </>
                    ) : (
                      <>
                        <span>Select {p.name}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
