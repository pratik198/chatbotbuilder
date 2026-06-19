import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, BookOpen, FileText, Globe, Trash2, Loader2,
  CheckCircle, XCircle, Clock, Upload, Link2, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'

const STATUS_ICONS: Record<string, { icon: any; color: string; label: string }> = {
  indexed:    { icon: CheckCircle, color: 'text-emerald-500 dark:text-emerald-400', label: 'Indexed' },
  processing: { icon: Loader2,     color: 'text-indigo-500 animate-spin', label: 'Processing' },
  pending:    { icon: Clock,       color: 'text-slate-400', label: 'Pending' },
  failed:     { icon: XCircle,     color: 'text-red-500', label: 'Failed' },
}

export default function KnowledgeBasePage() {
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null)
  const [showAddUrl, setShowAddUrl] = useState(false)
  const [showCreateKb, setShowCreateKb] = useState(false)
  const [url, setUrl]     = useState('')
  const [kbName, setKbName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  // Queries
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
    refetchInterval: 5_000, // poll while docs are indexing
    placeholderData: [],
  })

  const docs: any[] = (docList as any[]) ?? []

  // Mutations
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
    <div className="space-y-8">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/40 pb-5">
        <div>
          <h1 className="text-3.5xl font-black tracking-tight text-slate-850 dark:text-slate-100">Knowledge Base</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
            Manage training sources (documents, links, URLs) used by your AI models.
          </p>
        </div>
        {!showCreateKb && (
          <button
            onClick={() => setShowCreateKb(true)}
            className="flex items-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-indigo-500/10 transition-all duration-150"
          >
            <Plus className="w-4 h-4" />
            <span>New KB Category</span>
          </button>
        )}
      </div>

      {/* Create Category inline form block */}
      {showCreateKb && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-150 dark:border-slate-800 dark:bg-slate-900/45">
          <div className="flex items-center gap-2 mb-3.5">
            <BookOpen className="w-4.5 h-4.5 text-indigo-550" />
            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Create Knowledge Base Category</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={kbName}
              onChange={(e) => setKbName(e.target.value)}
              placeholder="e.g. Sales Documentation"
              className="flex-1 px-4 py-3 bg-white/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => createKbMutation.mutate(kbName)}
                disabled={!kbName.trim() || createKbMutation.isPending}
                className="flex items-center justify-center gap-2 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white px-5 py-3 rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
              >
                {createKbMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Create</span>
              </button>
              <button
                onClick={() => setShowCreateKb(false)}
                className="px-4 py-3 rounded-xl text-xs font-bold text-slate-550 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loadingKbs ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : kbs.length === 0 ? (
        <div className="glass-panel rounded-2xl flex flex-col items-center py-20 text-slate-400 dark:text-slate-500 border border-slate-200/50 dark:border-slate-800/40 dark:bg-slate-900/40">
          <BookOpen className="w-12 h-12 mb-4 opacity-30 text-indigo-505" />
          <p className="text-sm font-semibold">No knowledge categories available</p>
          <button
            onClick={() => setShowCreateKb(true)}
            className="mt-3.5 text-xs font-bold text-indigo-655 dark:text-indigo-400 hover:underline"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* KB list (left sidebar categories) */}
          <div className="w-full lg:w-56 flex-shrink-0 space-y-1 bg-slate-55/40 dark:bg-slate-900/20 p-2 rounded-2xl border border-slate-200/40 dark:border-slate-800/30">
            {kbs.map((kb: any) => {
              const active = activeKbId === kb.id
              return (
                <button
                  key={kb.id}
                  onClick={() => setSelectedKbId(kb.id)}
                  className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                    active
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10'
                      : 'text-slate-650 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-slate-850 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="w-4 h-4 flex-shrink-0 opacity-75" />
                    <span className="truncate flex-1">{kb.name}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Documents Table area (right) */}
          <div className="flex-1 w-full glass-panel dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 overflow-hidden shadow-sm">
            
            {/* Toolbar header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/10">
              <span className="font-bold text-slate-850 dark:text-slate-100 text-[15px]">
                {kbs.find((k: any) => k.id === activeKbId)?.name || 'Documents'}
              </span>
              
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-605 dark:hover:text-indigo-400 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload PDF/DOCX</span>
                </button>
                
                <button
                  onClick={() => setShowAddUrl(true)}
                  className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 hover:text-indigo-605 dark:hover:text-indigo-400 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  <span>Add URL Link</span>
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

            {/* Add URL inline form block */}
            <AnimatePresence>
              {showAddUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col sm:flex-row gap-3 overflow-hidden"
                >
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="e.g. https://docs.acme.com/help-articles"
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-805 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-100"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => activeKbId && addUrlMutation.mutate({ kbId: activeKbId, url })}
                      disabled={!url.trim() || addUrlMutation.isPending}
                      className="flex items-center justify-center gap-1.5 bg-indigo-650 hover:bg-indigo-700 dark:bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
                    >
                      {addUrlMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Add URL</span>
                    </button>
                    <button
                      onClick={() => { setShowAddUrl(false); setUrl('') }}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Documents List details */}
            <div className="divide-y divide-slate-150/40 dark:divide-slate-800/60">
              {loadingDocs ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : docs.length === 0 ? (
                <div className="flex flex-col items-center py-16 text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-transparent">
                  <FileText className="w-10 h-10 mb-3 opacity-30 text-indigo-505" />
                  <p className="text-sm font-semibold">No training resources loaded</p>
                  <p className="text-xs text-slate-450 dark:text-slate-550 mt-1">Upload files or input website links above to train the AI</p>
                </div>
              ) : (
                docs.map((doc: any) => {
                  const statusInfo = STATUS_ICONS[doc.status] || STATUS_ICONS.pending
                  const StatusIcon = statusInfo.icon
                  return (
                    <div key={doc.id} className="flex items-center justify-between gap-4 px-6 py-4.5 bg-white/30 dark:bg-transparent hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center border border-slate-150/50 dark:border-slate-800 flex-shrink-0">
                          {doc.sourceType === 'url' ? (
                            <Globe className="w-4.5 h-4.5 text-slate-400" />
                          ) : (
                            <FileText className="w-4.5 h-4.5 text-slate-450" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                          <p className="text-[10px] text-slate-450 dark:text-slate-500 font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                            <span className="uppercase">{doc.sourceType}</span>
                            {doc.status === 'indexed' && (
                              <>
                                <span>·</span>
                                <span>{doc.chunkCount || 0} training chunks</span>
                              </>
                            )}
                            {doc.errorMessage && (
                              <>
                                <span>·</span>
                                <span className="text-red-500 font-medium flex items-center gap-0.5">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                  <span>{doc.errorMessage.slice(0, 50)}</span>
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 flex-shrink-0">
                        {/* Status Label badge */}
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                          <span className="hidden sm:inline text-[10px] font-bold text-slate-405 dark:text-slate-500 uppercase tracking-wider">
                            {statusInfo.label}
                          </span>
                        </div>

                        <button
                          onClick={() => {
                            if (activeKbId && confirm('Remove this training document?')) {
                              deleteDocMutation.mutate({ kbId: activeKbId, docId: doc.id })
                            }
                          }}
                          className="p-2 text-slate-350 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850"
                          title="Remove document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>

        </div>
      )}
    </div>
  )
}
