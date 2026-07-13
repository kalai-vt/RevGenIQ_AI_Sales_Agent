import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  MessageSquare, Users, TrendingUp, Zap, ArrowUpRight, ArrowDownRight, Minus,
  Bot, BarChart3,
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { format, formatDistanceToNowStrict, parseISO } from 'date-fns'
import { analyticsApi, conversationsApi } from '@/services/api'
import { useAuthStore } from '@/app/store'

const COLOR_MAP: Record<string, string> = {
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
}

const fadeUp = (i: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.06, duration: 0.35 },
})

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
      <BarChart3 size={24} className="opacity-30" />
      <p className="text-xs">No {label} yet</p>
    </div>
  )
}

export default function DashboardPage() {
  const { workspace } = useAuthStore()
  const DAYS = 7

  // Same endpoints/formulas as the Analytics page (analytics/summary, /trends,
  // /intents) — this page is a 7-day-scoped summary of that same data, not a
  // separate calculation, so the two can never disagree.
  const { data: summary, isLoading: loadingS } = useQuery({
    queryKey: ['analytics-summary', DAYS],
    queryFn: () => analyticsApi.summary(DAYS).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: trends = [], isLoading: loadingT } = useQuery({
    queryKey: ['analytics-trends', DAYS],
    queryFn: () => analyticsApi.trends(DAYS).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: intents = [], isLoading: loadingI } = useQuery({
    queryKey: ['analytics-intents', DAYS],
    queryFn: () => analyticsApi.intents(DAYS).then(r => r.data),
    staleTime: 60_000,
  })

  const { data: recentConvs = [], isLoading: loadingC } = useQuery({
    queryKey: ['recent-conversations'],
    queryFn: () => conversationsApi.list({ limit: 5 }).then(r => r.data),
    staleTime: 30_000,
  })

  const fmtMs = (ms: number) => ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`
  const areaData = trends.map(t => ({
    day: (() => { try { return format(parseISO(t.date), 'EEE') } catch { return t.date } })(),
    conversations: t.conversations,
    leads: t.leads,
  }))

  const kpis = [
    {
      label: 'Conversations', value: (summary?.conversations ?? 0).toLocaleString(),
      change: summary?.changes.conversations ?? null, icon: MessageSquare, color: 'emerald',
    },
    {
      label: 'Leads captured', value: (summary?.leads ?? 0).toLocaleString(),
      change: summary?.changes.leads ?? null, icon: Users, color: 'blue',
    },
    {
      label: 'Conversion rate', value: `${summary?.conversion_rate ?? 0}%`,
      change: null, icon: TrendingUp, color: 'violet',
    },
    {
      label: 'Avg response time', value: fmtMs(summary?.avg_response_ms ?? 0),
      change: null, icon: Zap, color: 'amber',
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          {workspace?.name} · Last {DAYS} days
        </p>
      </motion.div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon
          const isUp = k.change != null && k.change > 0
          const isDown = k.change != null && k.change < 0
          return (
            <motion.div key={k.label} {...fadeUp(i + 1)}>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-card hover:shadow-card-hover transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {k.label}
                  </p>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${COLOR_MAP[k.color]}`}>
                    <Icon size={16} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {loadingS ? '—' : k.value}
                </p>
                {k.change != null ? (
                  <div className={`flex items-center gap-1 text-xs font-medium ${isUp ? 'text-emerald-600' : isDown ? 'text-red-500' : 'text-slate-400'}`}>
                    {isUp ? <ArrowUpRight size={13} /> : isDown ? <ArrowDownRight size={13} /> : <Minus size={13} />}
                    {Math.abs(k.change)}% vs last week
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Minus size={13} /> No prior data
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area chart */}
        <motion.div {...fadeUp(5)} className="xl:col-span-2">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-card">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity</h3>
                <p className="text-xs text-slate-400 mt-0.5">Conversations & leads this week</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>Conversations</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>Leads</span>
              </div>
            </div>
            {loadingT ? (
              <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
            ) : areaData.length === 0 ? (
              <EmptyPanel label="activity" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData}>
                  <defs>
                    <linearGradient id="gConv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gLead" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#f1f5f9', fontWeight: 600 }}
                    itemStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey="conversations" stroke="#10B981" fill="url(#gConv)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="leads" stroke="#3B82F6" fill="url(#gLead)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Pie chart */}
        <motion.div {...fadeUp(6)}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-card h-full">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Intent breakdown</h3>
            <p className="text-xs text-slate-400 mb-4">Why visitors start chats</p>
            {loadingI ? (
              <div className="h-40 flex items-center justify-center text-slate-400 text-sm animate-pulse">Loading…</div>
            ) : intents.length === 0 ? (
              <EmptyPanel label="intent data" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={intents} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                      {intents.map((d, i) => (
                        <Cell key={i} fill={d.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                      itemStyle={{ color: '#94a3b8' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-3">
                  {intents.map((d) => {
                    const total = intents.reduce((s, x) => s + x.value, 0)
                    const pct = total ? Math.round(d.value / total * 100) : 0
                    return (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400 capitalize">
                          <span className="w-2 h-2 rounded-full" style={{ background: d.color }}></span>
                          {d.name.replace(/_/g, ' ')}
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{pct}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent conversations */}
      <motion.div {...fadeUp(7)}>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Recent conversations</h3>
            <a href="/conversations" className="text-xs text-emerald-600 hover:text-emerald-500 font-medium">View all</a>
          </div>
          {loadingC ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-10 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}
            </div>
          ) : recentConvs.length === 0 ? (
            <div className="p-6"><EmptyPanel label="conversations" /></div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentConvs.map((c) => {
                const path = c.page_url ? c.page_url.replace(/^https?:\/\/[^/]+/, '') || '/' : '—'
                const timeSource = c.last_message_at ?? c.created_at
                const timeAgo = (() => {
                  try { return formatDistanceToNowStrict(parseISO(timeSource), { addSuffix: true }) } catch { return '' }
                })()
                const badge = c.lead_id ? 'lead' : c.status
                return (
                  <div key={c.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center flex-shrink-0">
                      <Bot size={14} className="text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{c.visitor_id}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{path}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        badge === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                        badge === 'lead'   ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                        'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      }`}>
                        {badge}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">{timeAgo}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
