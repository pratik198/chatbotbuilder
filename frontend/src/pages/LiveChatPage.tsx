import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { MessageSquare, Send, UserCheck, Clock, Hash } from 'lucide-react'

interface InboxConversation {
  id: string
  sessionKey: string
  botName: string
  lastMessage: string
  status: 'waiting' | 'active' | 'closed'
  startedAt: string
}

interface ChatMessage {
  role: string
  content: string
}

export default function LiveChatPage() {
  const { accessToken, user } = useAuthStore()
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [inbox, setInbox] = useState<InboxConversation[]>([])
  const [active, setActive] = useState<InboxConversation | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Connect to agent WebSocket
  useEffect(() => {
    if (!accessToken || !user?.id) return

    const wsUrl = `${window.location.origin.replace('http', 'ws')}/ws/inbox?token=${accessToken}&agentId=${user.id}&tenantId=__auto__`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        handleServerMessage(msg)
      } catch { /* ignore */ }
    }

    return () => ws.close()
  }, [accessToken, user?.id])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleServerMessage(msg: any) {
    if (msg.type === 'handoff_requested') {
      setInbox((prev) => {
        const exists = prev.find((c) => c.id === msg.conversationId)
        if (exists) return prev
        return [
          {
            id:         msg.conversationId,
            sessionKey: msg.sessionKey || msg.conversationId,
            botName:    msg.botName || 'Bot',
            lastMessage: msg.lastMessage || 'Customer requested agent',
            status:     'waiting',
            startedAt:  new Date().toISOString(),
          },
          ...prev,
        ]
      })
    } else if (msg.type === 'visitor_message' && active?.id === msg.conversationId) {
      setMessages((prev) => [...prev, { role: 'user', content: msg.content }])
    }
  }

  function acceptConversation(conv: InboxConversation) {
    setActive(conv)
    setMessages([{ role: 'system', content: 'You joined the conversation.' }])
    setInbox((prev) => prev.map((c) =>
      c.id === conv.id ? { ...c, status: 'active' } : c
    ))
    wsRef.current?.send(JSON.stringify({
      type:           'accept_handoff',
      conversationId: conv.id,
    }))
  }

  function sendReply() {
    if (!input.trim() || !active || !wsRef.current) return
    const content = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'agent', content }])
    wsRef.current.send(JSON.stringify({
      type:           'agent_message',
      conversationId: active.id,
      content,
    }))
  }



  return (
    <div className="flex flex-col md:flex-row gap-5 h-[calc(100vh-9.5rem)] min-h-[480px]">
      
      {/* 1. Inbox sidebar queue */}
      <div className="w-full md:w-72 bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col overflow-hidden flex-shrink-0 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
          <span className="font-bold text-slate-850 dark:text-slate-100 text-sm">Live Inbox</span>
          <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`} />
            <span>{connected ? 'Agent Online' : 'Connecting...'}</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {inbox.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 text-center px-5 py-12">
              <Clock className="w-9 h-9 mb-3 opacity-20 text-indigo-505" />
              <p className="text-xs font-bold">No active requests</p>
              <p className="text-[10px] text-slate-455 dark:text-slate-550 mt-1 leading-relaxed">
                Waiting for visitors to request human handoff...
              </p>
            </div>
          ) : (
            inbox.map((conv) => {
              const isActive = active?.id === conv.id
              return (
                <div
                  key={conv.id}
                  className={`px-5 py-4 transition-colors cursor-pointer border-l-2 ${
                    isActive 
                      ? 'bg-indigo-50/20 dark:bg-indigo-500/5 border-indigo-650' 
                      : 'border-transparent hover:bg-slate-50/50 dark:hover:bg-slate-900/10'
                  }`}
                  onClick={() => conv.status === 'active' ? setActive(conv) : undefined}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-150 truncate block max-w-[120px]">
                      Session: {conv.sessionKey.slice(0, 10)}...
                    </span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      conv.status === 'waiting'
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'
                        : 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30'
                    }`}>
                      {conv.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate leading-relaxed">{conv.lastMessage}</p>
                  
                  {conv.status === 'waiting' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); acceptConversation(conv) }}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/5 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Accept Handoff</span>
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Real-time chat messaging panel */}
      <div className="flex-1 bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col overflow-hidden shadow-sm">
        {!active ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 p-6 text-center">
            <MessageSquare className="w-10 h-10 mb-3 opacity-20 text-indigo-505" />
            <p className="text-sm font-semibold">Live agent console</p>
            <p className="text-xs text-slate-450 dark:text-slate-550 mt-1">Accept a pending conversation from the sidebar queue to start real-time human chat support.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2.5 bg-slate-50/50 dark:bg-slate-900/10 flex-shrink-0">
              <Hash className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500 dark:text-slate-405">Session ID:</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate flex-1">{active.sessionKey}</span>
              <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full text-slate-505 dark:text-slate-400 font-bold uppercase tracking-wider">{active.botName}</span>
            </div>

            {/* Chat timeline message bubbles */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/5">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : msg.role === 'agent' ? 'justify-end' : 'justify-center'}`}>
                  {msg.role === 'system' ? (
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-850/60 px-3.5 py-1 rounded-full uppercase tracking-wider">
                      {msg.content}
                    </span>
                  ) : (
                    <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-white dark:bg-slate-900 text-slate-805 dark:text-slate-205 border border-slate-200/50 dark:border-slate-800/80 rounded-bl-sm shadow-sm'
                        : 'bg-indigo-650 text-white rounded-br-sm shadow-sm'
                    }`}>
                      {msg.role === 'agent' && (
                        <p className="text-[9px] uppercase tracking-wider opacity-60 font-bold mb-1">Agent (You)</p>
                      )}
                      <p>{msg.content}</p>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="border-t border-slate-105 dark:border-slate-800 p-4 bg-white dark:bg-[#1E293B]/20 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Type a support reply..."
                className="flex-1 px-4 py-3 bg-slate-50/50 dark:bg-slate-950/40 border border-slate-205 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550 dark:text-slate-100"
              />
              <button
                onClick={sendReply}
                disabled={!input.trim()}
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shadow-md flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>

    </div>
  )
}
