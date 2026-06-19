import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MessageSquare, Loader2, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '@/lib/api'

export default function ConversationsPage() {
  const [selected, setSelected] = useState<any>(null)

  const { data: convData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/conversations').then((r) => r.data.data?.items ?? r.data.data ?? []),
    placeholderData: [],
  })

  const conversations: any[] = (convData as any[]) ?? []

  const { data: messages } = useQuery({
    queryKey: ['messages', selected?.id],
    queryFn: () => api.get(`/conversations/${selected.id}/messages`).then((r) => r.data.data?.items ?? []),
    enabled: !!selected,
    placeholderData: [],
  })

  const msgs: any[] = (messages as any[]) ?? []

  return (
    <div className="flex gap-4 h-[calc(100vh-8rem)]">
      {/* List panel */}
      <div className="w-80 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">
          Conversations
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-10"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-gray-400">
              <MessageSquare className="w-7 h-7 mb-2 opacity-40" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv: any) => (
              <button
                key={conv.id}
                onClick={() => setSelected(conv)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between ${
                  selected?.id === conv.id ? 'bg-blue-50' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">
                    {conv.sessionKey?.slice(0, 16)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {conv.messageCount} msgs ·{' '}
                    {conv.startedAt && formatDistanceToNow(new Date(conv.startedAt), { addSuffix: true })}
                  </p>
                </div>
                <ChevronRight className="w-3 h-3 text-gray-300" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message detail panel */}
      <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        {!selected ? (
          <div className="flex items-center justify-center flex-1 text-gray-400">
            <div className="text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5 py-3 border-b border-gray-100 text-sm text-gray-500">
              Session: <span className="font-mono text-xs">{selected.sessionKey}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {msgs.map((msg: any) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
