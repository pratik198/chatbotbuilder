import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, BookOpen, FileText, Globe, Trash2, Loader2,
  CheckCircle, XCircle, Clock, Upload, Link2
} from 'lucide-react'
import api from '@/lib/api'

const STATUS_ICONS: Record<string, { icon: any; color: string }> = {
  indexed:    { icon: CheckCircle, color: 'text-green-500' },
  processing: { icon: Loader2,     color: 'text-blue-500 animate-spin' },
  pending:    { icon: Clock,       color: 'text-gray-400' },
  failed:     { icon: XCircle,     color: 'text-red-500' },
}

export default function KnowledgeBasePage() {
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [showCreateKb, setShowCreateKb] = useState(false)
  const [url, setUrl]     = useState('')
  const [kbName, setKbName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  // ── Queries ──────────────────────────────────────────────────
  const { data: kbList, isLoading: loadingKbs } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: () => api.get('/knowledge-bases').then((r) => r.data.data?.items ?? []),
    placeholderData: [],
  })

  const kbs: any[] = (kbList as any[]) ?? []
  const activeKbId = selectedKbId ?? kbs[0]?.id ?? null

  const { data: docList, isLoading: loadingDocs } = useQuery({
    queryKey: ['documents', activeKbId],
    queryFn: () =>
      api.get(`/knowledge-bases/${activeKbId}/documents`).then((r) => r.data.data ?? []),
    enabled: !!activeKbId,
    refetchInterval: 5_000,  // poll while docs are indexing
    placeholderData: [],
  })

  const docs: any[] = (docList as any[]) ?? []

  // ── Mutations ────────────────────────────────────────────────
  const createKbMutation = useMutation({
    mutationFn: (name: string) =>
      api.post('/knowledge-bases', { name }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['knowledge-bases'] })
      setSelectedKbId(res.data.data?.id)
      setShowCreateKb(false)
      setKbName('')
    },
  })

  const addUrlMutation = useMutation({
    mutationFn: ({ kbId, url }: { kbId: string; url: string }) =>
      api.post(`/knowledge-bases/${kbId}/documents`, {
        name: url, sourceType: 'url', sourceUrl: url,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents', activeKbId] })
      setShowAddUrl(false)
      setUrl('')
    },
  })

  const uploadMutation = useMutation({
    mutationFn: ({ kbId, file }: { kbId: string; file: File }) => {
      const form = new FormData()
      form.append('file', file)
      return api.post(`/knowledge-bases/${kbId}/documents/upload`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', activeKbId] }),
  })

  const deleteDocMutation = useMutation({
    mutationFn: ({ kbId, docId }: { kbId: string; docId: string }) =>
      api.delete(`/knowledge-bases/${kbId}/documents/${docId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', activeKbId] }),
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="text-sm text-gray-500 mt-1">
            Train your bots with docs, URLs, and text
          </p>
        </div>
        <button
          onClick={() => setShowCreateKb(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" /> New Knowledge Base
        </button>
      </div>

      {/* Create KB form */}
      {showCreateKb && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex gap-3">
            <input
              value={kbName}
              onChange={(e) => setKbName(e.target.value)}
              placeholder="e.g. Product Documentation"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={() => createKbMutation.mutate(kbName)}
              disabled={!kbName.trim() || createKbMutation.isPending}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {createKbMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
              Create
            </button>
            <button onClick={() => setShowCreateKb(false)} className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
              Cancel
            </button>
          </div>
        </div>
      )}

      {loadingKbs ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      ) : kbs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center py-16 text-gray-400">
          <BookOpen className="w-10 h-10 mb-3 opacity-40" />
          <p className="text-sm">No knowledge bases yet</p>
          <button
            onClick={() => setShowCreateKb(true)}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Create your first one
          </button>
        </div>
      ) : (
        <div className="flex gap-4">
          {/* KB list (left) */}
          <div className="w-52 flex-shrink-0 space-y-1">
            {kbs.map((kb: any) => (
              <button
                key={kb.id}
                onClick={() => setSelectedKbId(kb.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeKbId === kb.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{kb.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Documents (right) */}
          <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <span className="font-semibold text-gray-900">
                {kbs.find((k: any) => k.id === activeKbId)?.name}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload PDF/DOCX
                </button>
                <button
                  onClick={() => setShowAddUrl(true)}
                  className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200"
                >
                  <Link2 className="w-3.5 h-3.5" /> Add URL
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file && activeKbId) {
                      uploadMutation.mutate({ kbId: activeKbId, file })
                      e.target.value = ''
                    }
                  }}
                />
              </div>
            </div>

            {/* Add URL inline form */}
            {showAddUrl && (
              <div className="px-5 py-3 border-b border-gray-100 flex gap-2">
                <input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.example.com/page"
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => activeKbId && addUrlMutation.mutate({ kbId: activeKbId, url })}
                  disabled={!url || addUrlMutation.isPending}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50"
                >
                  {addUrlMutation.isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                  Add
                </button>
                <button onClick={() => { setShowAddUrl(false); setUrl('') }} className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                  Cancel
                </button>
              </div>
            )}

            {/* Document list */}
            {loadingDocs ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            ) : docs.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-gray-400">
                <FileText className="w-8 h-8 mb-2 opacity-40" />
                <p className="text-sm">No documents yet</p>
                <p className="text-xs mt-1">Upload a PDF, DOCX, or add a URL above</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {docs.map((doc: any) => {
                  const { icon: StatusIcon, color } = STATUS_ICONS[doc.status] ?? STATUS_ICONS.pending
                  return (
                    <div key={doc.id} className="flex items-center gap-3 px-5 py-3">
                      {doc.sourceType === 'url' ? (
                        <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                        <p className="text-xs text-gray-400">
                          {doc.status === 'indexed' ? `${doc.chunkCount} chunks` : doc.status}
                          {doc.errorMessage && ` — ${doc.errorMessage.slice(0, 60)}`}
                        </p>
                      </div>
                      <StatusIcon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                      <button
                        onClick={() => {
                          if (activeKbId && confirm('Remove this document?')) {
                            deleteDocMutation.mutate({ kbId: activeKbId, docId: doc.id })
                          }
                        }}
                        className="p-1 text-gray-300 hover:text-red-400 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
