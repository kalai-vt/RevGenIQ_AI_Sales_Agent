import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import {
  MessageSquare, Trash2, Archive, CheckCircle2, Circle, Globe,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { conversationsApi, type ConversationSummary } from '@/services/api'
import { getErrorMessage } from '@/utils/getErrorMessage'

const FILTERS: { label: string; value: string | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Closed', value: 'closed' },
  { label: 'Archived', value: 'archived' },
]

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  closed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
}

function timeAgo(iso: string | null) {
  if (!iso) return ''
  try { return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true }) } catch { return '' }
}

function pathOf(url: string | null) {
  if (!url) return '—'
  return url.replace(/^https?:\/\/[^/]+/, '') || '/'
}

export default function ConversationsPage() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<string | undefined>(undefined)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { data: conversations = [], isLoading: loadingList } = useQuery({
    queryKey: ['conversations', filter],
    queryFn: () => conversationsApi.list({ status: filter, limit: 100 }).then((r) => r.data),
    staleTime: 15_000,
  })

  const { data: detail, isLoading: loadingDetail } = useQuery({
    queryKey: ['conversation', selectedId],
    queryFn: () => conversationsApi.get(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  })

  async function updateStatus(status: string) {
    if (!selectedId) return
    try {
      await conversationsApi.update(selectedId, { status })
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      queryClient.invalidateQueries({ queryKey: ['conversation', selectedId] })
      toast.success(`Marked as ${status}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update conversation'))
    }
  }

  async function remove() {
    if (!selectedId) return
    if (!window.confirm('Delete this conversation? This cannot be undone.')) return
    try {
      await conversationsApi.remove(selectedId)
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      setSelectedId(null)
      toast.success('Conversation deleted')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete conversation'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Conversations</h1>
        <p className="text-slate-500 text-sm mt-1">Review and manage all AI chat conversations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-220px)] min-h-[480px]">
        {/* List */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-800">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  filter === f.value
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {loadingList ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                <MessageSquare size={24} className="opacity-30" />
                <p className="text-xs">No conversations yet</p>
              </div>
            ) : (
              conversations.map((c: ConversationSummary) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    selectedId === c.id ? 'bg-emerald-50/60 dark:bg-emerald-900/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.visitor_id}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0 ${STATUS_STYLE[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                    <span className="truncate flex items-center gap-1">
                      <Globe size={11} /> {pathOf(c.page_url)}
                    </span>
                    <span className="flex-shrink-0">{timeAgo(c.last_message_at ?? c.created_at)}</span>
                  </div>
                  {c.lead_id && (
                    <span className="inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      Lead captured
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Detail */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col overflow-hidden">
          {!selectedId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-2">
              <MessageSquare size={32} className="opacity-20" />
              <p className="text-sm">Select a conversation to view the transcript</p>
            </div>
          ) : loadingDetail || !detail ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{detail.visitor_id}</p>
                  <p className="text-xs text-slate-400 truncate">{pathOf(detail.page_url)}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    title="Mark active"
                    onClick={() => updateStatus('active')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  >
                    <Circle size={15} />
                  </button>
                  <button
                    title="Mark closed"
                    onClick={() => updateStatus('closed')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <CheckCircle2 size={15} />
                  </button>
                  <button
                    title="Archive"
                    onClick={() => updateStatus('archived')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                  >
                    <Archive size={15} />
                  </button>
                  <button
                    title="Delete"
                    onClick={remove}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
                {detail.messages.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center mt-8">No messages in this conversation</p>
                ) : (
                  detail.messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        m.role === 'user'
                          ? 'bg-emerald-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-bl-sm'
                      }`}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.role === 'assistant' && (m.intent || m.confidence != null) && (
                          <p className="text-[10px] mt-1.5 opacity-60">
                            {m.intent}{m.confidence != null ? ` · ${Math.round(m.confidence * 100)}% confidence` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
