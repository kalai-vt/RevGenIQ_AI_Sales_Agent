import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MessageSquare, Users, TrendingUp, Zap,
  ArrowUpRight, ArrowDownRight, Minus,
  Globe, BarChart3, AlertTriangle, Gauge, MessagesSquare, Flame, Sparkles,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
  ComposedChart, Line,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import type { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent'
import { format, parseISO } from 'date-fns'
import { analyticsApi } from '@/services/api'

// ── Date range tabs ───────────────────────────────────────────────────────────

const RANGES = [
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
]

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, change, icon: Icon, color, delay,
}: {
  label: string; value: string; sub?: string; change?: number | null
  icon: React.ElementType; color: string; delay?: number
}) {
  const isUp = change != null && change > 0
  const isDown = change != null && change < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay ?? 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`p-2 rounded-xl ${color}`}>
          <Icon size={16} />
        </span>
      </div>
      <div>
        <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
      {change != null && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${
          isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-slate-400'
        }`}>
          {isUp ? <ArrowUpRight size={12} /> : isDown ? <ArrowDownRight size={12} /> : <Minus size={12} />}
          {Math.abs(change)}% vs previous period
        </div>
      )}
      {change == null && (
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <Minus size={12} /> No prior data
        </div>
      )}
    </motion.div>
  )
}

// ── Custom tooltip ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 shadow-xl text-xs">
      <p className="font-bold text-slate-700 dark:text-slate-300 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.name}:</span>
          <span className="font-bold text-slate-800 dark:text-slate-100">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
      <BarChart3 size={28} className="opacity-30" />
      <p className="text-sm">No {label} data yet</p>
      <p className="text-xs text-slate-300">Data will appear once visitors start chatting</p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [days, setDays] = useState(30)

  const { data: summary, isLoading: loadingS } = useQuery({
    queryKey: ['analytics-summary', days],
    queryFn: () => analyticsApi.summary(days).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: trends = [], isLoading: loadingT } = useQuery({
    queryKey: ['analytics-trends', days],
    queryFn: () => analyticsApi.trends(days).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: intents = [], isLoading: loadingI } = useQuery({
    queryKey: ['analytics-intents', days],
    queryFn: () => analyticsApi.intents(days).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: funnel = [], isLoading: loadingF } = useQuery({
    queryKey: ['analytics-funnel', days],
    queryFn: () => analyticsApi.leadFunnel(days).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: pages = [], isLoading: loadingP } = useQuery({
    queryKey: ['analytics-pages', days],
    queryFn: () => analyticsApi.topPages(days).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: priorities = [], isLoading: loadingPr } = useQuery({
    queryKey: ['analytics-priorities', days],
    queryFn: () => analyticsApi.leadsByPriority(days).then(r => r.data),
    staleTime: 60_000,
  })

  const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
  const fmtTrend = (d: string) => {
    try { return format(parseISO(d), days <= 7 ? 'EEE' : 'MMM d') } catch { return d }
  }

  // Combo chart series: raw daily volume (bar) alongside the derived daily
  // conversion rate (line) — conversion_rate[day] = leads[day] / conversations[day] * 100.
  // Computed client-side from the same /trends payload rather than a new endpoint,
  // since both counts are already present per day.
  const comboData = trends.map(t => ({
    date: fmtTrend(t.date),
    conversations: t.conversations,
    conversionRate: t.conversations ? Math.round((t.leads / t.conversations) * 1000) / 10 : 0,
  }))

  const trendData = trends.map(t => ({ ...t, date: fmtTrend(t.date) }))
  const funnelWithPct = funnel.map(f => {
    const total = funnel.reduce((s, x) => s + x.count, 0)
    return { ...f, label: f.status.charAt(0).toUpperCase() + f.status.slice(1), pct: total ? Math.round(f.count / total * 100) : 0 }
  })
  const prioritiesWithLabel = priorities.map(p => ({
    ...p, label: p.priority.charAt(0).toUpperCase() + p.priority.slice(1),
  }))
  const maxPage = pages[0]?.count || 1

  // Aggregated table row shape: Date | Conversations | Leads | Conversion % | Escalations,
  // reusing the same /trends payload as the combo chart above (one query, two views).
  const dailyTable = trends
    .slice()
    .reverse()
    .map(t => ({
      date: t.date,
      conversations: t.conversations,
      leads: t.leads,
      conversionPct: t.conversations ? Math.round((t.leads / t.conversations) * 1000) / 10 : 0,
      escalations: t.escalations,
    }))

  // Auto-generated text summary — every clause below is a direct read of an
  // already-computed metric; see the KPI formulas documented alongside each card.
  const topIntent = intents[0]
  const topIntentPct = topIntent && intents.length
    ? Math.round((topIntent.value / intents.reduce((s, x) => s + x.value, 0)) * 100)
    : 0
  const convChange = summary?.changes.conversations ?? null
  const insightText = summary && summary.conversations > 0
    ? `Over the last ${days} days, your AI agent handled ${summary.conversations} conversation${summary.conversations === 1 ? '' : 's'} `
      + `and captured ${summary.leads} lead${summary.leads === 1 ? '' : 's'} (${summary.conversion_rate}% conversion`
      + (convChange != null ? `, ${convChange >= 0 ? 'up' : 'down'} ${Math.abs(convChange)}% vs the previous period` : '')
      + `). It responded in an average of ${fmtMs(summary.avg_response_ms)} and needed human escalation in `
      + `${summary.escalation_rate}% of chats. Visitors exchanged an average of ${summary.avg_messages_per_conversation} `
      + `messages per conversation`
      + (topIntent ? `, and the most common topic was "${topIntent.name.replace(/_/g, ' ')}" (${topIntentPct}% of replies).` : '.')
    : `No conversations yet in the last ${days} days — insights will appear once visitors start chatting with your widget.`

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Deep insights into your AI agent performance</p>
        </div>
        {/* Date range tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                days === r.days
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Conversations" delay={0}
          value={loadingS ? '—' : (summary?.conversations ?? 0).toLocaleString()}
          change={summary?.changes.conversations ?? undefined}
          icon={MessageSquare} color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
        <KpiCard
          label="Leads Captured" delay={0.06}
          value={loadingS ? '—' : (summary?.leads ?? 0).toLocaleString()}
          change={summary?.changes.leads ?? undefined}
          icon={Users} color="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />
        <KpiCard
          label="Conversion Rate" delay={0.12}
          value={loadingS ? '—' : `${summary?.conversion_rate ?? 0}%`}
          sub="leads ÷ conversations"
          icon={TrendingUp} color="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
        <KpiCard
          label="Avg Response Time" delay={0.18}
          value={loadingS ? '—' : fmtMs(summary?.avg_response_ms ?? 0)}
          sub="AI response latency"
          icon={Zap} color="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Quality KPI Cards — formulas documented per card */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Escalation Rate" delay={0.22}
          value={loadingS ? '—' : `${summary?.escalation_rate ?? 0}%`}
          sub="escalated ÷ conversations"
          icon={AlertTriangle} color="bg-red-500/10 text-red-600 dark:text-red-400"
        />
        <KpiCard
          label="Avg Intent Confidence" delay={0.26}
          value={loadingS ? '—' : `${Math.round((summary?.avg_confidence ?? 0) * 100)}%`}
          sub="avg(classifier confidence)"
          icon={Gauge} color="bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
        />
        <KpiCard
          label="Msgs / Conversation" delay={0.3}
          value={loadingS ? '—' : (summary?.avg_messages_per_conversation ?? 0).toString()}
          sub="messages ÷ conversations"
          icon={MessagesSquare} color="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
        />
        <KpiCard
          label="High-Priority Leads" delay={0.34}
          value={loadingS ? '—' : `${summary?.high_priority_lead_rate ?? 0}%`}
          sub="high-priority ÷ leads"
          icon={Flame} color="bg-orange-500/10 text-orange-600 dark:text-orange-400"
        />
      </div>

      {/* Auto-generated insight summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.36 }}
        className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-950/40 dark:to-blue-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-5 flex items-start gap-3"
      >
        <span className="p-2 rounded-xl bg-white/70 dark:bg-slate-900/50 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
          <Sparkles size={16} />
        </span>
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {loadingS ? 'Generating insight…' : insightText}
        </p>
      </motion.div>

      {/* Trend Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Conversations & Leads</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daily activity over the last {days} days</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-emerald-500 rounded-full inline-block" />Conversations</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-blue-500 rounded-full inline-block" />Leads</span>
          </div>
        </div>
        {loadingT ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading chart…</div>
        ) : trendData.length === 0 ? (
          <EmptyChart label="trend" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="conversations" stroke="#10B981" strokeWidth={2} fill="url(#gConv)" dot={false} />
              <Area type="monotone" dataKey="leads" stroke="#3B82F6" strokeWidth={2} fill="url(#gLead)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Combo Chart: volume (bar) vs conversion rate (line) — see comboData formula above */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Volume vs Conversion Rate</h2>
            <p className="text-xs text-slate-400 mt-0.5">Daily conversation volume against the day's conversion rate</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="w-3 h-2 bg-emerald-500 rounded-sm inline-block" />Conversations</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-1 bg-violet-500 rounded-full inline-block" />Conversion %</span>
          </div>
        </div>
        {loadingT ? (
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading chart…</div>
        ) : comboData.length === 0 ? (
          <EmptyChart label="volume/conversion" />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={comboData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} unit="%" />
              <Tooltip content={<ChartTooltip />} />
              <Bar yAxisId="left" dataKey="conversations" name="conversations" fill="#10B981" radius={[4, 4, 0, 0]} barSize={18} />
              <Line yAxisId="right" type="monotone" dataKey="conversionRate" name="conversionRate" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 3, fill: '#8B5CF6' }} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* Intent + Funnel + Priority row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Intent Pie */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.28 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Intent Distribution</h2>
          <p className="text-xs text-slate-400 mb-5">What visitors are asking about</p>
          {loadingI ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : intents.length === 0 ? (
            <EmptyChart label="intent" />
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={intents} cx="50%" cy="50%" innerRadius={48} outerRadius={72} dataKey="value" paddingAngle={3}>
                    {intents.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [v, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {intents.map((e) => {
                  const total = intents.reduce((s, x) => s + x.value, 0)
                  const pct = total ? Math.round(e.value / total * 100) : 0
                  return (
                    <div key={e.name}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium capitalize">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                          {e.name}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{pct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: e.color }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Lead Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.34 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Lead Funnel</h2>
          <p className="text-xs text-slate-400 mb-5">Lead status breakdown</p>
          {loadingF ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : funnel.every(f => f.count === 0) ? (
            <EmptyChart label="lead funnel" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelWithPct} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {funnelWithPct.map((f, i) => <Cell key={i} fill={f.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        {/* Leads by Priority */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.38 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">Leads by Priority</h2>
          <p className="text-xs text-slate-400 mb-5">Lead quality breakdown</p>
          {loadingPr ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
          ) : prioritiesWithLabel.every(p => p.count === 0) ? (
            <EmptyChart label="priority" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={prioritiesWithLabel} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {prioritiesWithLabel.map((p, i) => <Cell key={i} fill={p.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Messages overview + Top pages row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Messages KPI card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between"
        >
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Message Volume</h2>
            <p className="text-xs text-slate-400">Total messages exchanged</p>
          </div>
          <div className="mt-6">
            <p className="text-5xl font-black text-slate-900 dark:text-white">
              {loadingS ? '—' : (summary?.messages ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-slate-400 mt-1">in last {days} days</p>
          </div>
          {summary?.changes.messages != null && (
            <div className={`flex items-center gap-1 mt-4 text-xs font-semibold ${
              (summary.changes.messages ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {(summary.changes.messages ?? 0) >= 0
                ? <ArrowUpRight size={12} />
                : <ArrowDownRight size={12} />}
              {Math.abs(summary.changes.messages ?? 0)}% vs previous period
            </div>
          )}
        </motion.div>

        {/* Top Pages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.46 }}
          className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
        >
          <div className="flex items-center gap-2 mb-5">
            <Globe size={16} className="text-slate-400" />
            <h2 className="font-bold text-slate-900 dark:text-white">Top Pages</h2>
            <span className="ml-auto text-xs text-slate-400">where chats started</span>
          </div>
          {loadingP ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : pages.length === 0 ? (
            <EmptyChart label="page" />
          ) : (
            <div className="space-y-3">
              {pages.slice(0, 6).map((p, i) => {
                const pct = Math.round(p.count / maxPage * 100)
                const short = p.url.replace(/^https?:\/\/[^/]+/, '') || '/'
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-[70%]" title={p.url}>
                        {short}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-100 ml-2 flex-shrink-0">{p.count}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Aggregated Table: Daily Performance Breakdown — reuses /trends payload */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}
        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6"
      >
        <h2 className="font-bold text-slate-900 dark:text-white mb-1">Daily Performance Breakdown</h2>
        <p className="text-xs text-slate-400 mb-5">Conversations, leads, conversion rate, and escalations per day</p>
        {loadingT ? (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
        ) : dailyTable.length === 0 ? (
          <EmptyChart label="daily performance" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400 uppercase tracking-wide">
                  <th className="text-left font-semibold py-2 pr-4">Date</th>
                  <th className="text-right font-semibold py-2 px-4">Conversations</th>
                  <th className="text-right font-semibold py-2 px-4">Leads</th>
                  <th className="text-right font-semibold py-2 px-4">Conversion %</th>
                  <th className="text-right font-semibold py-2 pl-4">Escalations</th>
                </tr>
              </thead>
              <tbody>
                {dailyTable.map((row) => (
                  <tr key={row.date} className="border-b border-slate-50 dark:border-slate-800/60 last:border-0">
                    <td className="py-2.5 pr-4 text-slate-700 dark:text-slate-300 font-medium">
                      {(() => { try { return format(parseISO(row.date), 'MMM d, yyyy') } catch { return row.date } })()}
                    </td>
                    <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-100">{row.conversations}</td>
                    <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-100">{row.leads}</td>
                    <td className="py-2.5 px-4 text-right text-slate-800 dark:text-slate-100">{row.conversionPct}%</td>
                    <td className="py-2.5 pl-4 text-right">
                      {row.escalations > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-semibold">{row.escalations}</span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
