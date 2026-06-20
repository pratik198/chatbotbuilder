import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Loader2, ChevronRight, Hash, User, Bot, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'

export default function ConversationsPage() {
  const [selected, setSelected] = useState<any>(null)

  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then((r) => r.data?.items ?? r.data?.data?.items ?? []),
    placeholderData: [],
  })

  const conversations: any[] = (convData as any[]) ?? []

  const { data: messages, isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selected?.id],
    queryFn: () => api.get(`/conversations/${selected.id}/messages`).then((r) => r.data?.items ?? r.data?.data?.items ?? []),
    enabled: !!selected,
    placeholderData: [],
  })

  const msgs: any[] = (messages as any[]) ?? []

  return (
    <div className="flex flex-col md:flex-row gap-5 h-[calc(100vh-9.5rem)] min-h-[480px]">
      
      {/* 1. Conversations Sidebar List */}
      <div className="w-full md:w-80 bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col overflow-hidden flex-shrink-0 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/10 flex items-center justify-between">
          <span className="font-bold text-slate-850 dark:text-slate-100 text-sm">Conversations</span>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-850 px-2 py-0.5 rounded-full font-bold text-slate-500 dark:text-slate-400">
            {conversations.length} total
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/40">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-slate-400 dark:text-slate-500 text-center px-4">
              <MessageSquare className="w-8 h-8 mb-3 opacity-20 text-indigo-500" />
              <p className="text-xs font-bold">No sessions found</p>
              <p className="text-[10px] text-slate-450 dark:text-slate-550 mt-1">Sessions will display once a client chats with your bot.</p>
            </div>
          ) : (
            conversations.map((conv: any) => {
              const isActive = selected?.id === conv.id
              const sessionSnippet = conv.sessionKey?.slice(0, 12) || 'Anonymous'
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={`w-full text-left px-5 py-4 hover:bg-slate-50/60 dark:hover:bg-slate-900/20 flex items-center justify-between transition-colors border-l-2 ${
                    isActive 
                      ? 'bg-indigo-50/20 dark:bg-indigo-500/5 border-indigo-650' 
                      : 'border-transparent'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs font-bold text-slate-850 dark:text-slate-150 truncate block">
                        {sessionSnippet}...
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold flex items-center gap-1.5 flex-wrap">
                      <span>{conv.messageCount} messages</span>
                      <span>·</span>
                      {conv.startedAt && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true })}</span>
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'text-indigo-500 translate-x-0.5' : 'text-slate-300 dark:text-slate-700'}`} />
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* 2. Messages Timeline Panel (Right) */}
      <div className="flex-1 bg-white dark:bg-[#1E293B]/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 flex flex-col overflow-hidden shadow-sm">
        {!selected ? (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 dark:text-slate-500 p-6 text-center">
            <MessageSquare className="w-10 h-10 mb-3 opacity-20 text-indigo-505" />
            <p className="text-sm font-semibold">Select a conversation</p>
            <p className="text-xs text-slate-450 dark:text-slate-550 mt-1">Choose a visitor session from the sidebar to inspect messaging transcripts.</p>
          </div>
        ) : (
          <>
            {/* Header info */}
            <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-900/10 flex-shrink-0">
              <Hash className="w-4 h-4 text-slate-405" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Session ID:</span>
              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-100 truncate flex-1">{selected.sessionKey}</span>
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30 dark:bg-slate-950/5">
              {loadingMessages ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-450" />
                </div>
              ) : msgs.length === 0 ? (
                <p className="text-xs text-slate-400 text-center">No messages logged in this session.</p>
              ) : (
                msgs.map((msg: any) => {
                  const isUser = msg.role === 'user'
                  return (
                    <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-end gap-2.5`}>
                      {/* Left icon avatar */}
                      {!isUser && (
                        <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-center text-indigo-650 dark:text-indigo-400 flex-shrink-0">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-indigo-650 text-white rounded-br-sm shadow-sm'
                          : 'bg-white dark:bg-slate-900 text-slate-805 dark:text-slate-205 border border-slate-200/50 dark:border-slate-805/85 rounded-bl-sm shadow-sm'
                      }`}>
                        <p>{msg.content}</p>
                      </div>

                      {/* Right icon avatar */}
                      {isUser && (
                        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-455 flex-shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}
      </div>

    </div>
  )
}
