import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNowStrict, parseISO } from 'date-fns'
import {
  Users, Flame, Gauge, X, Trash2, Mail, Phone, Building2, Globe, Send,
} from 'lucide-react'
import toast from 'react-hot-toast'

import { leadsApi, type Lead } from '@/services/api'
import { getErrorMessage } from '@/utils/getErrorMessage'

const STATUS_OPTIONS = ['new', 'contacted', 'qualified', 'converted', 'lost'] as const
const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  contacted: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  qualified: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
  converted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

const PRIORITY_STYLE: Record<string, string> = {
  low: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
}

function timeAgo(iso: string | null) {
  if (!iso) return '—'
  try { return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true }) } catch { return '—' }
}

export default function LeadsPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [noteType, setNoteType] = useState('note')
  const [noteText, setNoteText] = useState('')

  const { data: stats } = useQuery({
    queryKey: ['lead-stats'],
    queryFn: () => leadsApi.stats().then((r) => r.data),
    staleTime: 30_000,
  })

  const { data: leads = [], isLoading: loadingList } = useQuery({
    queryKey: ['leads', statusFilter, priorityFilter],
    queryFn: () => leadsApi.list({
      status: statusFilter || undefined,
      priority: priorityFilter || undefined,
      limit: 100,
    }).then((r) => r.data),
    staleTime: 15_000,
  })

  const { data: detail } = useQuery({
    queryKey: ['lead', selectedId],
    queryFn: () => leadsApi.get(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  })

  const { data: activities = [] } = useQuery({
    queryKey: ['lead-activities', selectedId],
    queryFn: () => leadsApi.activities(selectedId!).then((r) => r.data),
    enabled: !!selectedId,
  })

  function invalidateAll() {
    queryClient.invalidateQueries({ queryKey: ['leads'] })
    queryClient.invalidateQueries({ queryKey: ['lead-stats'] })
    queryClient.invalidateQueries({ queryKey: ['lead', selectedId] })
  }

  async function updateField(id: string, field: 'status' | 'priority', value: string) {
    try {
      await leadsApi.update(id, { [field]: value })
      invalidateAll()
      toast.success(`${field === 'status' ? 'Status' : 'Priority'} updated`)
    } catch (err) {
      toast.error(getErrorMessage(err, `Failed to update ${field}`))
    }
  }

  async function removeLead(id: string) {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return
    try {
      await leadsApi.remove(id)
      if (selectedId === id) setSelectedId(null)
      invalidateAll()
      toast.success('Lead deleted')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete lead'))
    }
  }

  async function submitActivity() {
    if (!selectedId || !noteText.trim()) return
    try {
      await leadsApi.addActivity(selectedId, { activity_type: noteType, content: noteText.trim() })
      queryClient.invalidateQueries({ queryKey: ['lead-activities', selectedId] })
      setNoteText('')
      toast.success('Activity logged')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to log activity'))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Leads</h1>
        <p className="text-slate-500 text-sm mt-1">Track and manage leads captured by your AI agent</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Leads</span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400"><Users size={16} /></span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.total ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">High Priority</span>
            <span className="p-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400"><Flame size={16} /></span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats?.high_priority ?? '—'}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Lead Score</span>
            <span className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400"><Gauge size={16} /></span>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats ? stats.avg_score.toFixed(1) : '—'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-900"
        >
          <option value="">All priorities</option>
          {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {loadingList ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
            <Users size={28} className="opacity-30" />
            <p className="text-sm">No leads yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left font-semibold py-2.5 px-4">Name</th>
                  <th className="text-left font-semibold py-2.5 px-4">Company</th>
                  <th className="text-left font-semibold py-2.5 px-4">Status</th>
                  <th className="text-left font-semibold py-2.5 px-4">Priority</th>
                  <th className="text-right font-semibold py-2.5 px-4">Score</th>
                  <th className="text-left font-semibold py-2.5 px-4">Source</th>
                  <th className="text-left font-semibold py-2.5 px-4">Created</th>
                  <th className="text-right font-semibold py-2.5 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l: Lead) => (
                  <tr
                    key={l.id}
                    onClick={() => setSelectedId(l.id)}
                    className="border-b border-slate-50 dark:border-slate-800/60 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer"
                  >
                    <td className="py-2.5 px-4">
                      <p className="font-medium text-slate-800 dark:text-slate-200">{l.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{l.email}</p>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{l.company_name || '—'}</td>
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={l.status}
                        onChange={(e) => updateField(l.id, 'status', e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_STYLE[l.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={l.priority}
                        onChange={(e) => updateField(l.id, 'priority', e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${PRIORITY_STYLE[l.priority]}`}
                      >
                        {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 px-4 text-right font-semibold text-slate-800 dark:text-slate-100">{l.lead_score.toFixed(1)}</td>
                    <td className="py-2.5 px-4 text-slate-500 capitalize">{l.source}</td>
                    <td className="py-2.5 px-4 text-slate-400">{timeAgo(l.created_at)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); removeLead(l.id) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        title="Delete lead"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedId && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setSelectedId(null)}>
          <div className="absolute inset-0 bg-slate-900/30" />
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl overflow-y-auto"
          >
            {!detail ? (
              <div className="p-6 text-slate-400 text-sm animate-pulse">Loading…</div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">{detail.name || 'Unknown'}</h2>
                    <p className="text-xs text-slate-400">Lead since {timeAgo(detail.created_at)}</p>
                  </div>
                  <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLE[detail.status]}`}>{detail.status}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PRIORITY_STYLE[detail.priority]}`}>{detail.priority} priority</span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Score {detail.lead_score.toFixed(1)}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {detail.email && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Mail size={14} className="text-slate-400" /> {detail.email}</div>}
                  {detail.phone && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Phone size={14} className="text-slate-400" /> {detail.phone}</div>}
                  {detail.company_name && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Building2 size={14} className="text-slate-400" /> {detail.company_name}</div>}
                  {detail.website && <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><Globe size={14} className="text-slate-400" /> {detail.website}</div>}
                </div>

                {(detail.requirement || detail.quantity || detail.budget) && (
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1 text-xs">
                    {detail.requirement && <p><span className="text-slate-400">Requirement:</span> <span className="text-slate-700 dark:text-slate-200">{detail.requirement}</span></p>}
                    {detail.quantity && <p><span className="text-slate-400">Quantity:</span> <span className="text-slate-700 dark:text-slate-200">{detail.quantity}</span></p>}
                    {detail.budget && <p><span className="text-slate-400">Budget:</span> <span className="text-slate-700 dark:text-slate-200">{detail.budget}</span></p>}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Activity timeline</h3>
                  <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
                    {activities.length === 0 ? (
                      <p className="text-xs text-slate-400">No activity logged yet</p>
                    ) : (
                      activities.map((a) => (
                        <div key={a.id} className="text-xs bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2.5">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-semibold text-slate-700 dark:text-slate-200 capitalize">{a.activity_type}</span>
                            <span className="text-slate-400">{timeAgo(a.created_at)}</span>
                          </div>
                          {a.content && <p className="text-slate-500 dark:text-slate-400">{a.content}</p>}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={noteType}
                      onChange={(e) => setNoteType(e.target.value)}
                      className="px-2 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent"
                    >
                      <option value="note">Note</option>
                      <option value="call">Call</option>
                      <option value="email">Email</option>
                    </select>
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && submitActivity()}
                      placeholder="Log an activity…"
                      className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-transparent"
                    />
                    <button
                      onClick={submitActivity}
                      disabled={!noteText.trim()}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
