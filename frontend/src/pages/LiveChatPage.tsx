import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { MessageSquare, Send, UserCheck, Clock } from 'lucide-react'

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

/**
 * Agent Live Chat Inbox.
 * Connects to the agent WebSocket (/ws/inbox) to receive real-time handoff notifications.
 * Agents can pick up conversations and reply as "agent".
 */
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
      // A visitor requested a human agent
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
      // Visitor sent a new message in the active conversation
      setMessages((prev) => [...prev, { role: 'user', content: msg.content }])
    }
  }

  function acceptConversation(conv: InboxConversation) {
    setActive(conv)
    setMessages([{ role: 'system', content: 'You joined the conversation.' }])
    setInbox((prev) => prev.map((c) =>
      c.id === conv.id ? { ...c, status: 'active' } : c
    ))
    // Tell the server we accepted this conversation
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

  const waiting = inbox.filter((c) => c.status === 'waiting')

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* Inbox sidebar */}
      <div className="w-72 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden flex-shrink-0">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-gray-900">Inbox</span>
          <div className={`flex items-center gap-1.5 text-xs font-medium ${connected ? 'text-green-600' : 'text-gray-400'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
            {connected ? 'Online' : 'Connecting...'}
          </div>
        </div>

        {waiting.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-gray-400 py-10">
            <Clock className="w-7 h-7 mb-2 opacity-40" />
            <p className="text-sm">No pending chats</p>
            <p className="text-xs mt-1 text-gray-300">Waiting for handoff requests...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {inbox.map((conv) => (
              <div
                key={conv.id}
                className={`px-4 py-3 cursor-pointer hover:bg-gray-50 ${active?.id === conv.id ? 'bg-blue-50' : ''}`}
                onClick={() => conv.status === 'active' ? setActive(conv) : undefined}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {conv.sessionKey.slice(0, 12)}...
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    conv.status === 'waiting'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {conv.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate">{conv.lastMessage}</p>
                {conv.status === 'waiting' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); acceptConversation(conv) }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Accept
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat panel */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {!active ? (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Accept a conversation to start chatting</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-900">
                Session {active.sessionKey.slice(0, 16)}
              </span>
              <span className="text-xs text-gray-400 ml-auto">{active.botName}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : msg.role === 'agent' ? 'justify-end' : 'justify-center'}`}>
                  {msg.role === 'system' ? (
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {msg.content}
                    </span>
                  ) : (
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.role === 'user'
                        ? 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        : 'bg-blue-600 text-white rounded-br-sm'
                    }`}>
                      {msg.role === 'agent' && (
                        <p className="text-xs opacity-70 mb-0.5">You</p>
                      )}
                      {msg.content}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-100 p-4 flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendReply() } }}
                placeholder="Type a reply..."
                className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={sendReply}
                disabled={!input.trim()}
                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-40"
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
