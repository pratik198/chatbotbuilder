import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Loader2, Sparkles, Paperclip, Smile, Mic, Copy, ThumbsUp, ThumbsDown, Maximize2, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const PLATFORM_BOT_TOKEN = import.meta.env.VITE_PLATFORM_BOT_TOKEN || ''

interface Msg { role: 'user' | 'assistant'; text: string; copied?: boolean; feedback?: 'up' | 'down' | null }

const suggestedPrompts = [
  'How do I add a webhook?',
  'Configure chatbot styling',
  'Search contacts'
]

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

  const send = async (customText?: string) => {
    const text = (customText || input).trim()
    if (!text || loading || !PLATFORM_BOT_TOKEN) return
    if (!customText) setInput('')
    
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

  const handleCopy = async (idx: number, text: string) => {
    await navigator.clipboard.writeText(text)
    setMsgs(prev => prev.map((m, i) => i === idx ? { ...m, copied: true } : m))
    setTimeout(() => {
      setMsgs(prev => prev.map((m, i) => i === idx ? { ...m, copied: false } : m))
    }, 2000)
  }

  const handleFeedback = (idx: number, type: 'up' | 'down') => {
    setMsgs(prev => prev.map((m, i) => {
      if (i === idx) {
        const current = m.feedback
        return { ...m, feedback: current === type ? null : type }
      }
      return m
    }))
  }

  if (!PLATFORM_BOT_TOKEN) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3.5">
      
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="w-96 bg-white dark:bg-[#1E293B] rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-800 flex flex-col overflow-hidden h-[500px]"
          >
            {/* Header section */}
            <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-indigo-650 to-indigo-550 dark:from-indigo-650 dark:to-indigo-500 text-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/15 flex items-center justify-center text-white">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold block leading-none">ChatPlatform Assistant</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[9px] text-indigo-100 font-bold uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-100 hover:text-white transition-colors">
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-indigo-100 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat timeline messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40 dark:bg-slate-950/15">
              
              {msgs.map((m, i) => {
                const isUser = m.role === 'user'
                return (
                  <div key={i} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-indigo-650 text-white rounded-br-sm shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-805 dark:text-slate-205 border border-slate-200/50 dark:border-slate-800/80 rounded-bl-sm shadow-sm'
                    }`}>
                      <p>{m.text}</p>
                    </div>

                    {/* Meta info / Feedback for assistant messages */}
                    {!isUser && i > 0 && (
                      <div className="flex items-center gap-2 mt-1.5 px-1.5 text-slate-400">
                        <button 
                          onClick={() => handleCopy(i, m.text)}
                          className="text-[10px] font-semibold hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{m.copied ? 'Copied' : 'Copy'}</span>
                        </button>
                        <span>·</span>
                        <button 
                          onClick={() => handleFeedback(i, 'up')}
                          className={`hover:text-slate-650 dark:hover:text-slate-350 transition-colors ${m.feedback === 'up' ? 'text-indigo-600 dark:text-indigo-400' : ''}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleFeedback(i, 'down')}
                          className={`hover:text-slate-650 dark:hover:text-slate-350 transition-colors ${m.feedback === 'down' ? 'text-red-500' : ''}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/80 px-3.5 py-2.5 rounded-2xl rounded-bl-sm">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-605" />
                  </div>
                </div>
              )}

              {/* Suggestion prompt chips */}
              {msgs.length === 1 && !loading && (
                <div className="pt-2 flex flex-col gap-2">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                    <span>Suggested prompts</span>
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {suggestedPrompts.map(pText => (
                      <button
                        key={pText}
                        onClick={() => send(pText)}
                        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 text-left text-xs font-semibold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-indigo-650 dark:hover:text-indigo-400 hover:border-indigo-500/20 transition-all"
                      >
                        {pText}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input reply form area */}
            <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 space-y-2">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550 dark:text-slate-100"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shadow-md flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Extra action controls */}
              <div className="flex items-center gap-1.5 px-1.5 text-slate-400 dark:text-slate-500">
                <button className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40" title="Attach file">
                  <Paperclip className="w-4 h-4" />
                </button>
                <button className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40" title="Add emoji">
                  <Smile className="w-4 h-4" />
                </button>
                <button className="p-1 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40" title="Voice message">
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen((o) => !o)}
        className="w-14 h-14 bg-indigo-600 hover:bg-indigo-705 text-white rounded-full shadow-2xl flex items-center justify-center transition-all cursor-pointer relative"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -45, opacity: 0 }} transition={{ duration: 0.15 }}>
              <MessageCircle className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  )
}
