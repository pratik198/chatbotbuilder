import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'

const PLATFORM_BOT_TOKEN = import.meta.env.VITE_PLATFORM_BOT_TOKEN || ''

interface Msg { role: 'user' | 'assistant'; text: string }

export default function PlatformChat() {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeted, setGreeted] = useState(false)
  const sessionKey = useRef('visitor-' + Math.random().toString(36).slice(2))
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open && !greeted && PLATFORM_BOT_TOKEN) {
      setMsgs([{ role: 'assistant', text: "Hi! I'm the ChatPlatform assistant. How can I help you today?" }])
      setGreeted(true)
    }
  }, [open, greeted])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading || !PLATFORM_BOT_TOKEN) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const resp = await fetch('/public/v1/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedToken: PLATFORM_BOT_TOKEN, sessionKey: sessionKey.current, message: text }),
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
          } catch {}
        }
      }
      setMsgs((m) => [...m, { role: 'assistant', text: content || 'Sorry, no response.' }])
    } catch {
      setMsgs((m) => [...m, { role: 'assistant', text: 'Sorry, something went wrong.' }])
    } finally {
      setLoading(false)
    }
  }

  if (!PLATFORM_BOT_TOKEN) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm font-semibold">ChatPlatform Support</span>
            </div>
            <button onClick={() => setOpen(false)} className="hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-72 min-h-[180px] bg-gray-50">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-3 py-2 rounded-xl">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-2 border-t border-gray-100 flex gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Type a message…"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-105"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  )
}
