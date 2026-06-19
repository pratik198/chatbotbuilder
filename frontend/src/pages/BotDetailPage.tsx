import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Code2, Rocket, Loader2, MessageSquare, Send, X, Palette,
  Plus, Trash2, Zap
} from 'lucide-react'
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

  // Test panel state
  const [showTest, setShowTest]       = useState(false)
  const [testMsgs, setTestMsgs]       = useState<ChatMsg[]>([])
  const [testInput, setTestInput]     = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const testSessionKey = useRef('test-' + Math.random().toString(36).slice(2))
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

  // Send test message via authenticated test-chat endpoint (works for draft bots)
  const sendTestMessage = async () => {
    const text = testInput.trim()
    if (!text || !bot?.id || testLoading) return

    setTestInput('')
    setTestMsgs((m) => [...m, { role: 'user', text }])
    setTestLoading(true)

    try {
      const resp = await api.post(`/bots/${bot.id}/test-chat`, { message: text })
      const content = resp.data?.data?.content || 'No response'
      setTestMsgs((m) => [...m, { role: 'assistant', text: content }])
    } catch {
      setTestMsgs((m) => [...m, { role: 'assistant', text: 'Error: could not reach the AI service.' }])
    } finally {
      setTestLoading(false)
    }
  }

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    )
  }

  const primaryColor = form.widgetConfig?.primary_color ?? '#4F46E5'
  const welcomeMsg   = form.widgetConfig?.welcome_message ?? 'Hi! How can I help?'
  const position     = form.widgetConfig?.position ?? 'bottom-right'

  return (
    <div className="max-w-2xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/bots" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{bot.name}</h1>
          <p className="text-xs text-gray-400">{bot.status}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => { setShowTest((v) => !v); setTestMsgs([]) }}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <MessageSquare className="w-3 h-3" />
            Test Bot
          </button>
          {bot.status !== 'active' && (
            <button
              onClick={() => publishMutation.mutate()}
              disabled={publishMutation.isPending}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {publishMutation.isPending
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Rocket className="w-3 h-3" />}
              Publish
            </button>
          )}
          <button
            onClick={copyEmbedCode}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <Code2 className="w-3 h-3" />
            {embedCopied ? 'Copied!' : 'Embed Code'}
          </button>
        </div>
      </div>

      {/* Test Panel */}
      {showTest && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100" style={{ backgroundColor: primaryColor + '10' }}>
            <span className="text-sm font-semibold text-gray-800">Test: {bot.name}</span>
            <button onClick={() => setShowTest(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-col h-72">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {testMsgs.length === 0 && (
                <p className="text-xs text-gray-400 text-center pt-6">
                  {bot.status === 'active'
                    ? `Say something to test ${bot.name}`
                    : 'Publish the bot first to enable testing'}
                </p>
              )}
              {testMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className="max-w-xs px-3 py-2 rounded-xl text-sm"
                    style={
                      m.role === 'user'
                        ? { backgroundColor: primaryColor, color: '#fff' }
                        : { backgroundColor: '#f3f4f6', color: '#111827' }
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {testLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-3 py-2 rounded-xl">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                  </div>
                </div>
              )}
              <div ref={testEndRef} />
            </div>
            <div className="px-3 py-2 border-t border-gray-100 flex gap-2">
              <input
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                placeholder="Type a message…"
                className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendTestMessage}
                disabled={!testInput.trim() || testLoading}
                className="p-2 rounded-lg text-white disabled:opacity-40"
                style={{ backgroundColor: primaryColor }}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main config form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Bot Name</label>
          <input
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">LLM Model</label>
          <select
            value={form.modelName}
            onChange={(e) => set('modelName', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Temperature <span className="text-gray-400 font-normal">({form.temperature ?? 0.7})</span>
          </label>
          <input
            type="range" min="0" max="1" step="0.1"
            value={form.temperature ?? 0.7}
            onChange={(e) => set('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Precise</span><span>Creative</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">System Prompt</label>
          <textarea
            value={form.systemPrompt || ''}
            onChange={(e) => set('systemPrompt', e.target.value)}
            rows={5}
            placeholder="You are a helpful support assistant for Acme Corp. Be friendly, concise, and accurate."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { field: 'ragEnabled',         label: 'Knowledge Base (RAG)' },
            { field: 'leadCaptureEnabled', label: 'Lead Capture' },
            { field: 'liveChatEnabled',    label: 'Live Chat Handoff' },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form[field]}
                onChange={(e) => set(field, e.target.checked)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>

        {/* Widget appearance */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Widget Appearance</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Primary color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setWidget('primary_color', e.target.value)}
                  className="h-9 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <span className="text-sm text-gray-600 font-mono">{primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Button position</label>
              <select
                value={position}
                onChange={(e) => setWidget('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">Welcome message</label>
              <input
                value={welcomeMsg}
                onChange={(e) => setWidget('welcome_message', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Hi! How can I help you today?"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {updateMutation.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <Save className="w-4 h-4" />}
          Save changes
        </button>
      </form>

      {/* Bot Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-gray-900">Actions</h2>
            <span className="text-xs text-gray-400">Triggered automatically on events</span>
          </div>
          <button
            onClick={() => setShowAddAction(true)}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-3.5 h-3.5" /> Add Action
          </button>
        </div>

        {showAddAction && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Action name</label>
                <input value={newAction.name} onChange={(e) => setNewAction(a => ({ ...a, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Notify Slack" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Trigger</label>
                <select value={newAction.triggerOn} onChange={(e) => setNewAction(a => ({ ...a, triggerOn: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Webhook URL</label>
              <input value={newAction.config.url}
                onChange={(e) => setNewAction(a => ({ ...a, config: { url: e.target.value } }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://hooks.slack.com/..." />
            </div>
            <div className="flex gap-2">
              <button onClick={() => createActionMutation.mutate(newAction)}
                disabled={!newAction.name || createActionMutation.isPending}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">
                {createActionMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />} Save
              </button>
              <button onClick={() => setShowAddAction(false)} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-200 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        {(actions as any[]).length === 0 && !showAddAction ? (
          <div className="text-center py-8 text-gray-400">
            <Zap className="w-7 h-7 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No actions yet. Add a webhook to notify external services.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {(actions as any[]).map((action: any) => (
              <div key={action.id} className="flex items-center gap-3 py-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="text-xs text-gray-400">{TRIGGER_LABELS[action.triggerOn] ?? action.triggerOn} · {action.type}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${action.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {action.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => deleteActionMutation.mutate(action.id)}
                  className="p-1.5 text-gray-300 hover:text-red-400 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
