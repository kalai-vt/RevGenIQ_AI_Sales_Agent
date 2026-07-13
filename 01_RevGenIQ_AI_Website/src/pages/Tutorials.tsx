import { motion } from 'framer-motion'
import { PlayCircle } from 'lucide-react'
import PageShell from '../components/layout/PageShell'

const tutorials = [
  {
    title: 'Getting started: from signup to your first conversation',
    time: '5 min',
    steps: [
      'Create your workspace and pick your industry — this drives your AI agent\'s persona automatically.',
      'Add at least one knowledge source (a document, FAQ, or your website URL) under Knowledge Base.',
      'Copy your embed snippet from Widget Builder and paste it into your site before </body>.',
      'Open your site and send your AI agent a real question to see it respond.',
    ],
  },
  {
    title: 'Customizing your widget\'s look and voice',
    time: '4 min',
    steps: [
      'Open Widget Builder in the dashboard.',
      'Set your agent\'s name, welcome message, and suggested opening questions.',
      'Pick brand colors and widget position (bottom-left or bottom-right).',
      'Changes apply instantly — no redeploying your website needed.',
    ],
  },
  {
    title: 'Building a knowledge base your AI can actually use',
    time: '6 min',
    steps: [
      'Upload PDFs, Word docs, or plain FAQs under Knowledge Base.',
      'Or point the crawler at your website URL to ingest existing pages automatically.',
      'Check each source\'s status — "Ready" means it\'s chunked and searchable by the AI.',
      'Ask your widget a question covered by the source to confirm it retrieves the right context.',
    ],
  },
  {
    title: 'Reading your Analytics dashboard',
    time: '5 min',
    steps: [
      'Conversations and Leads cards show volume over your selected date range, with period-over-period change.',
      'The Intent Breakdown chart shows what visitors are actually asking about.',
      'The Lead Funnel tracks status from New through Converted.',
      'Use Top Pages to see which pages on your site drive the most conversations.',
    ],
  },
]

export default function Tutorials() {
  return (
    <PageShell eyebrow="Tutorials" title="Step-by-step guides" subtitle="Practical walkthroughs for getting the most out of RevGenIQ AI.">
      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {tutorials.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}
            className="border-2 border-slate-100 rounded-2xl p-6 hover:border-blue-200 hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <PlayCircle size={18} className="text-blue-600" />
              <span className="text-slate-400 text-xs font-bold">{t.time} read</span>
            </div>
            <h3 className="font-bold text-slate-900 mb-3">{t.title}</h3>
            <ol className="space-y-1.5 list-decimal list-inside">
              {t.steps.map((s) => (
                <li key={s} className="text-slate-500 text-sm leading-relaxed">{s}</li>
              ))}
            </ol>
          </motion.div>
        ))}
      </div>
    </PageShell>
  )
}
