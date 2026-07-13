import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, FileText, HelpCircle, Upload, Plus, Trash2,
  RefreshCw, CheckCircle, Clock, AlertCircle, Loader2,
  Search, X, ChevronDown, Database, BookOpen, File, ChevronRight,
} from 'lucide-react'
import { knowledgeApi, type KnowledgeSource, type WebsitePageStatus } from '@/services/api'
import toast from 'react-hot-toast'

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  website: { icon: Globe,      label: 'Website',  color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30' },
  pdf:     { icon: FileText,   label: 'PDF',      color: 'text-red-500 bg-red-50 dark:bg-red-900/30' },
  docx:    { icon: FileText,   label: 'DOCX',     color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
  txt:     { icon: File,       label: 'TXT',      color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  faq:     { icon: HelpCircle, label: 'FAQ',      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30' },
  manual:  { icon: BookOpen,   label: 'Manual',   color: 'text-violet-500 bg-violet-50 dark:bg-violet-900/30' },
}

const STATUS_META = {
  ready:      { icon: CheckCircle, label: 'Ready',      cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  processing: { icon: Loader2,     label: 'Processing', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  pending:    { icon: Clock,       label: 'Pending',    cls: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  failed:     { icon: AlertCircle, label: 'Failed',     cls: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
}

function fmtSize(bytes?: number | null) {
  if (!bytes) return null
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

function fmtDate(iso?: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Modal base ────────────────────────────────────────────────────────────────

function Modal({ open, onClose, title, children }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-700"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Add URL Modal ─────────────────────────────────────────────────────────────

function AddUrlModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [maxPages, setMaxPages] = useState(30)
  const [frequency, setFrequency] = useState<'never' | 'daily' | 'weekly' | 'monthly'>('never')
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => knowledgeApi.addUrl(name, url, maxPages, frequency),
    onSuccess: () => {
      toast.success('Crawl started!')
      qc.invalidateQueries({ queryKey: ['kb-sources'] })
      qc.invalidateQueries({ queryKey: ['kb-stats'] })
      onClose(); setName(''); setUrl(''); setMaxPages(30); setFrequency('never')
    },
    onError: () => toast.error('Failed to start crawl'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Add Website URL">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Source Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Company Website"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Website URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Max Pages: <span className="text-blue-600 font-bold">{maxPages}</span>
          </label>
          <input type="range" min={1} max={100} value={maxPages}
            onChange={e => setMaxPages(+e.target.value)} className="w-full accent-blue-600" />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>1</span><span>100</span></div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Keep it up to date</label>
          <select value={frequency} onChange={e => setFrequency(e.target.value as typeof frequency)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="never">Never (crawl once, re-crawl manually)</option>
            <option value="daily">Re-crawl daily</option>
            <option value="weekly">Re-crawl weekly</option>
            <option value="monthly">Re-crawl monthly</option>
          </select>
          <p className="text-[11px] text-slate-400 mt-1">Only pages that changed since the last crawl get re-processed.</p>
        </div>
        <button onClick={() => mut.mutate()} disabled={!name || !url || mut.isPending}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
          {mut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Globe size={14} />}
          Start Crawl
        </button>
      </div>
    </Modal>
  )
}

// ── Upload Modal ──────────────────────────────────────────────────────────────

function UploadModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => knowledgeApi.upload(file!, name || file!.name),
    onSuccess: () => {
      toast.success('Document uploaded — processing started')
      qc.invalidateQueries({ queryKey: ['kb-sources'] })
      qc.invalidateQueries({ queryKey: ['kb-stats'] })
      onClose(); setName(''); setFile(null)
    },
    onError: () => toast.error('Upload failed'),
  })

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, '')) }
  }, [name])

  return (
    <Modal open={open} onClose={onClose} title="Upload Document">
      <div className="space-y-4">
        <div onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)} onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 hover:bg-blue-50/50'}`}>
          <input ref={inputRef} type="file" accept=".pdf,.docx,.txt" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); if (!name) setName(f.name.replace(/\.[^.]+$/, '')) } }} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileText size={28} className="text-blue-500" />
              <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{file.name}</p>
              <p className="text-xs text-slate-400">{fmtSize(file.size)}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={28} className="text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">Drop file here or click to browse</p>
              <p className="text-xs text-slate-400">PDF, DOCX, TXT — up to 50MB</p>
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Source Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Product Brochure"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => mut.mutate()} disabled={!file || mut.isPending}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
          {mut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          Upload & Process
        </button>
      </div>
    </Modal>
  )
}

// ── Add FAQ Modal ─────────────────────────────────────────────────────────────

function AddFaqModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const qc = useQueryClient()

  const mut = useMutation({
    mutationFn: () => knowledgeApi.addFaq(name, content),
    onSuccess: () => {
      toast.success('FAQ added!')
      qc.invalidateQueries({ queryKey: ['kb-sources'] })
      qc.invalidateQueries({ queryKey: ['kb-stats'] })
      onClose(); setName(''); setContent('')
    },
    onError: () => toast.error('Failed to add FAQ'),
  })

  return (
    <Modal open={open} onClose={onClose} title="Add FAQ / Text Content">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Source Name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Product FAQs"
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Content</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={8}
            placeholder={'Q: What is your return policy?\nA: We offer 30-day returns.\n\nQ: How to contact support?\nA: Email support@example.com'}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none font-mono" />
        </div>
        <button onClick={() => mut.mutate()} disabled={!name || !content.trim() || mut.isPending}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
          {mut.isPending ? <Loader2 size={14} className="animate-spin" /> : <HelpCircle size={14} />}
          Save FAQ
        </button>
      </div>
    </Modal>
  )
}

// ── Source card ───────────────────────────────────────────────────────────────

const PAGE_STATUS_META: Record<string, { label: string; cls: string }> = {
  crawled:   { label: 'Crawled',   cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
  unchanged: { label: 'Unchanged', cls: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
  failed:    { label: 'Failed',    cls: 'text-red-600 bg-red-50 dark:bg-red-900/30' },
  pending:   { label: 'Pending',   cls: 'text-slate-500 bg-slate-100 dark:bg-slate-800' },
}

function PageList({ sourceId }: { sourceId: string }) {
  const { data: pages, isLoading } = useQuery({
    queryKey: ['kb-pages', sourceId],
    queryFn: () => knowledgeApi.pages(sourceId).then(r => r.data),
  })

  if (isLoading) return <p className="text-xs text-slate-400 py-3">Loading pages…</p>
  if (!pages || pages.length === 0) return <p className="text-xs text-slate-400 py-3">No pages crawled yet.</p>

  return (
    <div className="space-y-1.5 py-2 max-h-64 overflow-y-auto">
      {pages.map(p => {
        const s = PAGE_STATUS_META[p.status] ?? PAGE_STATUS_META.pending
        return (
          <div key={p.id} className="flex items-start justify-between gap-3 px-2 py-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-700 dark:text-slate-300 truncate">{p.title || p.url}</p>
              <p className="text-[10px] text-slate-400 truncate">{p.url}</p>
              {p.error_message && <p className="text-[10px] text-red-500 mt-0.5 line-clamp-2">{p.error_message}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {p.chunk_count > 0 && <span className="text-[10px] text-slate-400">{p.chunk_count} chunks</span>}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${s.cls}`}>{s.label}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function SourceCard({ source, onDelete }: { source: KnowledgeSource; onDelete: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const qc = useQueryClient()
  const meta = TYPE_META[source.source_type] ?? TYPE_META.manual
  const status = STATUS_META[source.status as keyof typeof STATUS_META] ?? STATUS_META.pending
  const StatusIcon = status.icon
  const TypeIcon = meta.icon
  const isWebsite = source.source_type === 'website'

  const recrawlMut = useMutation({
    mutationFn: () => knowledgeApi.recrawl(source.id),
    onSuccess: () => {
      toast.success('Re-crawl started')
      qc.invalidateQueries({ queryKey: ['kb-sources'] })
      qc.invalidateQueries({ queryKey: ['kb-pages', source.id] })
    },
    onError: () => toast.error('Failed to start re-crawl'),
  })

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 flex items-start gap-4">
        <div className={`p-3 rounded-xl flex-shrink-0 ${meta.color}`}><TypeIcon size={18} /></div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">{source.name}</p>
              {source.url && (
                <a href={source.url} target="_blank" rel="noreferrer"
                  className="text-xs text-blue-500 hover:underline truncate block mt-0.5 max-w-xs">{source.url}</a>
              )}
            </div>
            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold flex-shrink-0 ${status.cls}`}>
              <StatusIcon size={10} />
              {status.label}
            </span>
          </div>

          {source.status === 'processing' && source.crawl_job?.pages_total && (
            <div className="mt-2">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Crawling…</span>
                <span>{source.crawl_job.pages_crawled} / {source.crawl_job.pages_total} pages</span>
              </div>
              <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full transition-all"
                  style={{ width: `${Math.round(source.crawl_job.pages_crawled / source.crawl_job.pages_total * 100)}%` }} />
              </div>
            </div>
          )}

          {source.error_message && (
            <p className="text-[11px] text-red-500 mt-1.5 line-clamp-2">{source.error_message}</p>
          )}

          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md font-semibold text-[10px] ${meta.color}`}>{meta.label}</span>
            {source.chunk_count > 0 && <span>{source.chunk_count} chunks</span>}
            {source.file_size && <span>{fmtSize(source.file_size)}</span>}
            {source.last_crawled_at ? (
              <span>Last crawled {fmtDate(source.last_crawled_at)}</span>
            ) : source.created_at && <span>{fmtDate(source.created_at)}</span>}
            {isWebsite && source.crawl_frequency && source.crawl_frequency !== 'never' && (
              <span className="capitalize">Auto re-crawl: {source.crawl_frequency}</span>
            )}
          </div>

          {isWebsite && (
            <button onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-blue-500 hover:text-blue-600">
              <ChevronRight size={12} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
              {expanded ? 'Hide pages' : 'View crawled pages'}
            </button>
          )}
        </div>

        {isWebsite && (
          <button onClick={() => recrawlMut.mutate()} disabled={recrawlMut.isPending || source.status === 'processing'}
            title="Re-crawl now"
            className="p-2 rounded-lg text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex-shrink-0 transition-colors disabled:opacity-40">
            <RefreshCw size={14} className={recrawlMut.isPending ? 'animate-spin' : ''} />
          </button>
        )}
        <button onClick={() => onDelete(source.id)}
          className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>

      <AnimatePresence>
        {isWebsite && expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-slate-100 dark:border-slate-800 px-4">
            <PageList sourceId={source.id} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

type ModalType = 'url' | 'upload' | 'faq' | null
type FilterType = 'all' | 'website' | 'pdf' | 'docx' | 'txt' | 'faq'

export default function KnowledgePage() {
  const [modal, setModal] = useState<ModalType>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const qc = useQueryClient()

  const { data: stats } = useQuery({
    queryKey: ['kb-stats'],
    queryFn: () => knowledgeApi.stats().then(r => r.data),
    refetchInterval: 5000,
  })

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['kb-sources'],
    queryFn: () => knowledgeApi.list().then(r => r.data),
    refetchInterval: (q) => {
      const data = q.state.data as KnowledgeSource[] | undefined
      return data?.some(s => s.status === 'processing' || s.status === 'pending') ? 3000 : 10000
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => knowledgeApi.delete(id),
    onSuccess: () => {
      toast.success('Source deleted')
      qc.invalidateQueries({ queryKey: ['kb-sources'] })
      qc.invalidateQueries({ queryKey: ['kb-stats'] })
      setDeleteId(null)
    },
    onError: () => toast.error('Delete failed'),
  })

  const filtered = sources.filter(s => {
    if (filter !== 'all' && s.source_type !== filter) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !(s.url?.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'website', label: 'Websites' },
    { key: 'pdf', label: 'PDFs' },
    { key: 'docx', label: 'DOCX' },
    { key: 'txt', label: 'TXT' },
    { key: 'faq', label: 'FAQs' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Knowledge Base</h1>
          <p className="text-slate-500 text-sm mt-1">Manage documents, URLs, and FAQs that power your AI agent</p>
        </div>
        <div className="relative">
          <button onClick={() => setAddOpen(v => !v)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/30">
            <Plus size={16} /> Add Source
            <ChevronDown size={14} className={`transition-transform ${addOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {addOpen && (
              <motion.div initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden">
                {[
                  { icon: Globe,      label: 'Website URL',      sub: 'Crawl a website',   type: 'url' as ModalType },
                  { icon: Upload,     label: 'Upload Document',  sub: 'PDF, DOCX, TXT',    type: 'upload' as ModalType },
                  { icon: HelpCircle, label: 'Add FAQ',          sub: 'Paste Q&A text',    type: 'faq' as ModalType },
                ].map(opt => (
                  <button key={opt.type} onClick={() => { setModal(opt.type); setAddOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left">
                    <opt.icon size={16} className="text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{opt.label}</p>
                      <p className="text-[11px] text-slate-400">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sources',    value: stats?.total_sources ?? 0, icon: BookOpen,    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Knowledge Chunks', value: stats?.total_chunks ?? 0,  icon: Database,    color: 'text-violet-600 bg-violet-50 dark:bg-violet-900/30' },
          { label: 'Ready',            value: stats?.ready ?? 0,          icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Processing',       value: stats?.processing ?? 0,     icon: RefreshCw,   color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <div className={`p-2 rounded-xl ${s.color}`}><s.icon size={16} /></div>
            <div>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1 flex-wrap">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filter === f.key
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
              {f.label}
              {f.key !== 'all' && (
                <span className="ml-1.5 text-[10px] text-slate-400">
                  {sources.filter(s => s.source_type === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sources…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Source list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center h-56 bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-center px-6">
          <BookOpen size={32} className="text-slate-200 dark:text-slate-700 mb-3" />
          <p className="font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {search || filter !== 'all' ? 'No sources match your filter' : 'No knowledge sources yet'}
          </p>
          <p className="text-sm text-slate-400">
            {search || filter !== 'all'
              ? 'Try changing your filter or search term'
              : 'Add a website URL, upload a document, or paste FAQs to get started'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filtered.map(s => <SourceCard key={s.id} source={s} onDelete={setDeleteId} />)}
          </AnimatePresence>
        </div>
      )}

      {/* Delete confirm */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Source">
        <div className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            This will permanently delete the source and all its knowledge chunks. Your AI agent will no longer have access to this content.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteId(null)}
              className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button onClick={() => deleteId && deleteMut.mutate(deleteId)} disabled={deleteMut.isPending}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
              {deleteMut.isPending ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Delete
            </button>
          </div>
        </div>
      </Modal>

      <AddUrlModal  open={modal === 'url'}    onClose={() => setModal(null)} />
      <UploadModal  open={modal === 'upload'} onClose={() => setModal(null)} />
      <AddFaqModal  open={modal === 'faq'}    onClose={() => setModal(null)} />
    </div>
  )
}
