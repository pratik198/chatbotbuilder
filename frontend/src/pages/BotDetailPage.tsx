import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Code2, Rocket, Loader2, MessageSquare, Send, X, Palette,
  Plus, Trash2, Zap, Settings, HelpCircle, Copy, Check
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'

const TRIGGER_LABELS: Record<string, string> = {
  lead_captured: 'Lead Captured',
  conversation_ended: 'Conversation Ended',
  handoff_requested: 'Handoff Requested',
}

const MODELS = [
  { id: 'deepseek-v3',    label: 'DeepSeek V3 (recommended)' },
  { id: 'deepseek-r1:8b', label: 'DeepSeek R1 8B (fast)' },
  { id: 'qwen3:8b',       label: 'Qwen3 8B' },
  { id: 'llama3.2:3b',    label: 'Llama 3.2 3B (fastest)' },
  { id: 'mistral',        label: 'Mistral 7B' },
]

interface ChatMsg { role: 'user' | 'assistant'; text: string }

export default function BotDetailPage() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [form, setForm] = useState<any>(null)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [newAction, setNewAction] = useState({ name: '', type: 'webhook', triggerOn: 'lead_captured', config: { url: '' } })
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'actions' | 'embed'>('general')

  // Test panel state
  const [showTest, setShowTest]       = useState(false)
  const [testMsgs, setTestMsgs]       = useState<ChatMsg[]>([])
  const [testInput, setTestInput]     = useState('')
  const [testLoading, setTestLoading] = useState(false)

  const testEndRef = useRef<HTMLDivElement>(null)

  const { data: bot, isLoading } = useQuery({
    queryKey: ['bot', id],
    queryFn: () => api.get(`/bots/${id}`).then((r) => r.data.data),
  })

  const { data: actions = [] } = useQuery({
    queryKey: ['bot-actions', id],
    queryFn: () => api.get(`/bots/${id}/actions`).then((r) => r.data.data ?? []),
    enabled: !!id,
  })

  const createActionMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/bots/${id}/actions`, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bot-actions', id] }); setShowAddAction(false) },
  })

  const deleteActionMutation = useMutation({
    mutationFn: (actionId: string) => api.delete(`/bots/${id}/actions/${actionId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot-actions', id] }),
  })

  useEffect(() => {
    if (bot && !form) setForm(bot)
  }, [bot])

  useEffect(() => {
    testEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [testMsgs])

  const updateMutation = useMutation({
    mutationFn: (payload: any) => api.put(`/bots/${id}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot', id] }),
  })

  const publishMutation = useMutation({
    mutationFn: () => api.post(`/bots/${id}/publish`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bot', id] }),
  })

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(form)
  }

  const copyEmbedCode = async () => {
    if (!bot?.embedToken) return
    const code = `<script src="${window.location.origin}/widget.js" data-bot="${bot.embedToken}" defer></script>`
    await navigator.clipboard.writeText(code)
    setEmbedCopied(true)
    setTimeout(() => setEmbedCopied(false), 2000)
  }

  const set = (field: string, value: any) =>
    setForm((f: any) => ({ ...f, [field]: value }))

  const setWidget = (key: string, value: string) =>
    setForm((f: any) => ({
      ...f,
      widgetConfig: { ...(f.widgetConfig ?? {}), [key]: value },
    }))

  const testSessionKey = useRef(`test-${id}-${Date.now()}`)

  const sendTestMessage = async () => {
    const text = testInput.trim()
    if (!text || !bot?.id || testLoading) return

    setTestInput('')
    setTestMsgs((m) => [...m, { role: 'user', text }])
    setTestLoading(true)

    try {
      if (bot.status === 'active' && bot.embedToken) {
        // Use public SSE endpoint — saves conversations to DB
        const resp = await fetch('/public/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ embedToken: bot.embedToken, sessionKey: testSessionKey.current, message: text }),
        })
        if (!resp.body) throw new Error('no body')
        const reader = resp.body.getReader()
        const dec = new TextDecoder()
        let buf = '', content = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n'); buf = lines.pop() ?? ''
          for (const line of lines) {
            if (!line.startsWith('data:')) continue
            try {
              const evt = JSON.parse(line.slice(5).trim())
              if (evt.type === 'done' && evt.content) content = evt.content
              if (evt.type === 'error') content = `Error: ${evt.message}`
            } catch {}
          }
        }
        setTestMsgs((m) => [...m, { role: 'assistant', text: content || 'No response.' }])
      } else {
        // Draft bot — authenticated endpoint (no conversation saved)
        const resp = await api.post(`/bots/${bot.id}/test-chat`, { message: text })
        const content = resp.data?.data?.content || 'No response'
        setTestMsgs((m) => [...m, { role: 'assistant', text: content }])
      }
    } catch {
      setTestMsgs((m) => [...m, { role: 'assistant', text: 'Error: could not reach the AI service.' }])
    } finally {
      setTestLoading(false)
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    )
  }

  const primaryColor = form.widgetConfig?.primary_color ?? '#4F46E5'
  const welcomeMsg   = form.widgetConfig?.welcome_message ?? 'Hi! How can I help?'
  const position     = form.widgetConfig?.position ?? 'bottom-right'

  const embedCodeString = `<script src="${window.location.origin}/widget.js" data-bot="${bot.embedToken}" defer></script>`

  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      
      {/* Bot Detail main container */}
      <div className="max-w-3xl space-y-6">
        
        {/* Header toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
          <div className="flex items-center gap-3">
            <Link to="/bots" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-450 dark:text-slate-500 transition-colors">
              <ArrowLeft className="w-4.5 h-4.5" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-850 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">{bot.name}</h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${bot.status === 'active' ? 'bg-emerald-500' : 'bg-slate-450'}`} />
                <span className="text-[10px] text-slate-400 dark:text-slate-550 font-bold uppercase tracking-wider">{bot.status}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setShowTest(true); setTestMsgs([]) }}
              className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-150"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Test Bot</span>
            </button>
            
            {bot.status !== 'active' && (
              <button
                onClick={() => publishMutation.mutate()}
                disabled={publishMutation.isPending}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-all duration-150"
              >
                {publishMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
                <span>Publish</span>
              </button>
            )}

            <button
              onClick={copyEmbedCode}
              className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-850 transition-all duration-150"
            >
              {embedCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Code2 className="w-3.5 h-3.5" />}
              <span>{embedCopied ? 'Copied' : 'Embed Link'}</span>
            </button>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-slate-200/50 dark:border-slate-800/40 p-1 space-x-1 bg-slate-100/50 dark:bg-slate-900/40 rounded-xl max-w-md">
          {[
            { id: 'general', label: 'General', icon: Settings },
            { id: 'appearance', label: 'Appearance', icon: Palette },
            { id: 'actions', label: 'Actions', icon: Zap },
            { id: 'embed', label: 'Install', icon: Code2 },
          ].map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all duration-150 ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-[#1E293B] text-indigo-650 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab contents */}
        <div className="bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 p-6 shadow-sm">
          
          <form onSubmit={handleSave} className="space-y-6">
            
            {activeTab === 'general' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">Bot Name</label>
                  <input
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">LLM Model</label>
                    <select
                      value={form.modelName}
                      onChange={(e) => set('modelName', e.target.value)}
                      className="w-full px-3 py-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-150"
                    >
                      {MODELS.map((m) => <option key={m.id} value={m.id} className="dark:bg-slate-900">{m.label}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Temperature ({form.temperature ?? 0.7})
                    </label>
                    <div className="px-3.5 py-3 border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/10 rounded-xl flex items-center justify-between gap-4">
                      <span className="text-[10px] text-slate-400 font-bold">Precise</span>
                      <input
                        type="range" min="0" max="1" step="0.1"
                        value={form.temperature ?? 0.7}
                        onChange={(e) => set('temperature', parseFloat(e.target.value))}
                        className="flex-1 accent-indigo-600"
                      />
                      <span className="text-[10px] text-slate-400 font-bold">Creative</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">System Instructions Prompt</label>
                  <textarea
                    value={form.systemPrompt || ''}
                    onChange={(e) => set('systemPrompt', e.target.value)}
                    rows={6}
                    placeholder="Describe how the assistant should behave, its tone, knowledge source limits, and protocols..."
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-550 dark:text-slate-100 resize-none leading-relaxed"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/60">
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-3">Feature Toggles</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { field: 'ragEnabled',         label: 'Knowledge Base (RAG)' },
                      { field: 'leadCaptureEnabled', label: 'Lead Capture' },
                      { field: 'liveChatEnabled',    label: 'Live Handoff' },
                    ].map(({ field, label }) => (
                      <label key={field} className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/10 cursor-pointer select-none group hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={!!form[field]}
                          onChange={(e) => set(field, e.target.checked)}
                          className="w-4 h-4 rounded accent-indigo-650 cursor-pointer"
                        />
                        <span className="text-xs font-semibold text-slate-705 dark:text-slate-300">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appearance' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Primary Theme Color</label>
                    <div className="flex items-center gap-3.5 px-3 py-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-805 rounded-xl">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setWidget('primary_color', e.target.value)}
                        className="h-9 w-14 rounded-lg border-0 cursor-pointer bg-transparent"
                      />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">{primaryColor}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2.5">Widget Position</label>
                    <select
                      value={position}
                      onChange={(e) => setWidget('position', e.target.value)}
                      className="w-full px-3 py-3.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-150"
                    >
                      <option value="bottom-right" className="dark:bg-slate-900">Bottom right</option>
                      <option value="bottom-left" className="dark:bg-slate-900">Bottom left</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">Welcome Greeting Message</label>
                  <input
                    value={welcomeMsg}
                    onChange={(e) => setWidget('welcome_message', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-505 dark:text-slate-100"
                    placeholder="Hi! How can I help you today?"
                  />
                </div>
              </div>
            )}

            {activeTab === 'actions' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-205">Webhook Actions</h3>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Trigger external HTTP POST endpoints on custom bot events</p>
                  </div>
                  {!showAddAction && (
                    <button
                      type="button"
                      onClick={() => setShowAddAction(true)}
                      className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 px-3 py-2 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-950/50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Webhook</span>
                    </button>
                  )}
                </div>

                {showAddAction && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Action name</label>
                        <input
                          value={newAction.name}
                          onChange={(e) => setNewAction(a => ({ ...a, name: e.target.value }))}
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-100"
                          placeholder="Slack Lead Alert"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Trigger Event</label>
                        <select
                          value={newAction.triggerOn}
                          onChange={(e) => setNewAction(a => ({ ...a, triggerOn: e.target.value }))}
                          className="w-full px-3 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-200"
                        >
                          {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v} className="dark:bg-slate-900">{l}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Webhook URL</label>
                      <input
                        value={newAction.config.url}
                        onChange={(e) => setNewAction(a => ({ ...a, config: { url: e.target.value } }))}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-100"
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => createActionMutation.mutate(newAction)}
                        disabled={!newAction.name || !newAction.config.url || createActionMutation.isPending}
                        className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                      >
                        {createActionMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        <span>Save Action</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddAction(false)}
                        className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                )}

                {actions.length === 0 && !showAddAction ? (
                  <div className="text-center py-8 text-slate-400 dark:text-slate-550">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-semibold">No webhook actions configured</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {actions.map((action: any) => (
                      <div key={action.id} className="flex items-center gap-4 py-4.5 bg-white dark:bg-transparent">
                        <div className="w-9 h-9 bg-purple-50 dark:bg-purple-950/20 rounded-xl flex items-center justify-center flex-shrink-0 border border-purple-100/50 dark:border-purple-900/20">
                          <Zap className="w-4.5 h-4.5 text-purple-650 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate">{action.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-550 mt-1 font-semibold truncate">
                            {TRIGGER_LABELS[action.triggerOn] ?? action.triggerOn} · {action.config.url}
                          </p>
                        </div>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          action.isActive ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-405' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {action.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteActionMutation.mutate(action.id)}
                          className="p-1.5 text-slate-350 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'embed' && (
              <div className="space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Client script tag installation</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Paste this snippet right before the closing <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono text-[10px]">&lt;/body&gt;</code> tag on your site.
                  </p>
                </div>

                <div className="relative">
                  <pre className="bg-slate-900 text-slate-300 dark:bg-slate-950 font-mono text-xs rounded-xl p-4 overflow-x-auto border border-slate-800 leading-normal pr-12">
                    <code>{embedCodeString}</code>
                  </pre>
                  <button
                    type="button"
                    onClick={copyEmbedCode}
                    className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    title="Copy Embed Code"
                  >
                    {embedCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-start gap-2.5 p-3.5 bg-indigo-50/50 dark:bg-indigo-950/15 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl text-xs text-indigo-700 dark:text-indigo-400">
                  <HelpCircle className="w-5 h-5 flex-shrink-0 text-indigo-500 mt-0.5" />
                  <p className="leading-relaxed">
                    Once the script tag runs on your domain, the chat platform will automatically connect and load client styles, theme colors, and the greetings configure values setup.
                  </p>
                </div>
              </div>
            )}

            {/* Form submit button for general/appearance settings */}
            {activeTab !== 'embed' && activeTab !== 'actions' && (
              <div className="pt-5 border-t border-slate-100 dark:border-slate-800/60">
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-550/10 transition-all duration-155"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            )}

          </form>

        </div>

      </div>

      {/* Test Bot Sidebar Panel Overlay */}
      <AnimatePresence>
        {showTest && (
          <>
            {/* Backdrop wrapper */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTest(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
            />

            {/* Test chat Drawer body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white dark:bg-[#0F172A] border-l border-slate-200/50 dark:border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden"
            >
              {/* Header */}
              <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50 dark:bg-slate-900/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate leading-none">Testing: {bot.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-semibold">Active Session Mode</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTest(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat timeline messages list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-slate-950/10">
                {testMsgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-550 p-6 text-center">
                    <MessageSquare className="w-9 h-9 mb-3 opacity-20 text-indigo-500" />
                    <p className="text-xs font-bold">Say something to test the bot</p>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 mt-1 leading-relaxed">
                      {bot.status === 'active' 
                        ? 'Simulate chat responses directly. Lead capture triggers webhook actions.' 
                        : 'Deploy changes to verify settings in draft mode.'}
                    </p>

                    {/* Suggested prompts list */}
                    <div className="mt-6 w-full flex flex-col gap-2">
                      {['Hello!', 'How do you capture leads?', 'What features do you support?'].map(pText => (
                        <button
                          key={pText}
                          onClick={() => {
                            setTestInput(pText)
                          }}
                          className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-left text-xs font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 dark:hover:text-indigo-400 hover:border-indigo-500/20 transition-all"
                        >
                          {pText}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {testMsgs.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-800/80 rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}

                {testLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-850 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-605" />
                    </div>
                  </div>
                )}
                <div ref={testEndRef} />
              </div>

              {/* Input reply form */}
              <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 flex gap-2 bg-white dark:bg-slate-900">
                <input
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550 dark:text-slate-100"
                />
                <button
                  onClick={sendTestMessage}
                  disabled={!testInput.trim() || testLoading}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl flex items-center justify-center disabled:opacity-40 flex-shrink-0 transition-colors shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  )
}
