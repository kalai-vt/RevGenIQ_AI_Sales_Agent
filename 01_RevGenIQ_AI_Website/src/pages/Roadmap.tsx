import { motion } from 'framer-motion'
import { CheckCircle2, Loader2, Circle } from 'lucide-react'
import PageShell from '../components/layout/PageShell'

const columns = [
  {
    title: 'Shipped', icon: CheckCircle2, color: 'text-green-600', items: [
      'Industry-aware AI persona system', 'In-widget Quote/Demo/Contact forms', 'Analytics dashboard', 'Team management',
    ],
  },
  {
    title: 'In progress', icon: Loader2, color: 'text-blue-600', items: [
      'Voice-enabled widget conversations', 'Deeper CRM integrations', 'Multi-language auto-detection',
    ],
  },
  {
    title: 'Exploring', icon: Circle, color: 'text-slate-400', items: [
      'Native mobile app for the dashboard', 'Outbound campaign automation', 'Marketplace of industry persona templates',
    ],
  },
]

export default function Roadmap() {
  return (
    <PageShell eyebrow="Roadmap" title="What we're building next" subtitle="Directional, not a promise — priorities shift as we learn from customers.">
      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {columns.map((col, i) => (
          <motion.div
            key={col.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="border-2 border-slate-100 rounded-2xl p-6"
          >
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${col.color}`}>
              <col.icon size={16} /> {col.title}
            </h3>
            <ul className="space-y-3">
              {col.items.map((item) => (
                <li key={item} className="text-slate-600 text-sm bg-slate-50 rounded-lg px-3 py-2">{item}</li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}
