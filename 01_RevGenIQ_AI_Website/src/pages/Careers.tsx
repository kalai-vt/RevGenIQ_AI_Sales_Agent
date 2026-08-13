import { motion } from 'framer-motion'
import { MapPin, Briefcase, ArrowRight } from 'lucide-react'
import PageShell from '../components/layout/PageShell'
import { SUPPORT_EMAIL } from '../config'

const roles = [
  { title: 'Founding Full-Stack Engineer', location: 'Remote', type: 'Full-time', desc: 'Own features end-to-end across our FastAPI backend and React dashboard.' },
  { title: 'AI/ML Engineer', location: 'Remote', type: 'Full-time', desc: 'Improve intent classification, RAG retrieval quality, and persona-driven response generation.' },
  { title: 'Customer Success Lead', location: 'Remote', type: 'Full-time', desc: 'Help new customers get their knowledge base and widget live, and turn feedback into product improvements.' },
]

export default function Careers() {
  return (
    <PageShell
      eyebrow="Careers"
      title="Help us build AI employees for every business"
      subtitle="We're a small, early team — every hire shapes how the product works."
    >
      <div className="space-y-4 max-w-3xl mx-auto">
        {roles.map((r, i) => (
          <motion.a
            key={r.title}
            href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Application: ' + r.title)}`}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="flex items-center justify-between gap-4 border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all"
          >
            <div>
              <h3 className="font-bold text-slate-900 mb-1">{r.title}</h3>
              <p className="text-slate-500 text-sm mb-2">{r.desc}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}</span>
                <span className="flex items-center gap-1"><Briefcase size={12} /> {r.type}</span>
              </div>
            </div>
            <ArrowRight size={18} className="text-blue-600 flex-shrink-0" />
          </motion.a>
        ))}
      </div>
      <p className="text-center text-slate-500 text-sm mt-10">
        Don't see a fit? Reach out anyway at{' '}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 font-semibold hover:underline">{SUPPORT_EMAIL}</a>
      </p>
    </PageShell>
  )
}
