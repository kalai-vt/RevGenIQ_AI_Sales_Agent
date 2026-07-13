import { motion } from 'framer-motion'
import PageShell from '../components/layout/PageShell'

const entries = [
  {
    version: '2.1', date: 'July 2026', tag: 'New',
    items: [
      'Widget CTAs (Request Quote, Book a Demo, Contact Sales) now open real in-widget forms instead of just sending a chat message',
      'Industry-aware AI persona — the agent\'s role, tone, and suggested actions now adapt to your business\'s industry',
      'Conversations, Leads, and Team Management modules',
    ],
  },
  {
    version: '2.0', date: 'June 2026', tag: 'Update',
    items: [
      'Rebranded to RevGenIQ AI',
      'Analytics dashboard with conversation trends, intent breakdown, and lead funnel',
      'Reorganized platform into dedicated Website, Dashboard, and AI Agent services',
    ],
  },
  {
    version: '1.x', date: 'Earlier', tag: 'Foundation',
    items: [
      'Embeddable AI chat widget with Shadow DOM isolation for any website',
      'Tenant-scoped knowledge base with document, URL, and FAQ ingestion',
      'Multi-tenant workspaces with role-based team access',
    ],
  },
]

const TAG_COLOR: Record<string, string> = {
  New: 'bg-green-100 text-green-700',
  Update: 'bg-blue-100 text-blue-700',
  Foundation: 'bg-slate-200 text-slate-600',
}

export default function Changelog() {
  return (
    <PageShell eyebrow="Changelog" title="What's new" subtitle="Recent updates to the RevGenIQ AI platform.">
      <div className="max-w-2xl mx-auto space-y-10">
        {entries.map((e, i) => (
          <motion.div
            key={e.version}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="border-l-2 border-slate-200 pl-6 relative"
          >
            <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-blue-600" />
            <div className="flex items-center gap-3 mb-3">
              <span className="font-black text-slate-900 text-lg">v{e.version}</span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TAG_COLOR[e.tag]}`}>{e.tag}</span>
              <span className="text-slate-400 text-sm">{e.date}</span>
            </div>
            <ul className="space-y-2">
              {e.items.map((item) => (
                <li key={item} className="text-slate-600 text-sm leading-relaxed">— {item}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}
