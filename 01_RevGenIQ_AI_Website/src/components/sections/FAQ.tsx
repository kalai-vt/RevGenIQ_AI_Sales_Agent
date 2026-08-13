import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

const faqs = [
  { q: 'How long does it take to set up?', a: 'Most customers are live in under 20 minutes. Sign up, train your AI with your content, paste one line of code — done.' },
  { q: 'Do I need to know how to code?', a: 'No. Sales IQ is fully no-code. Our visual widget builder and knowledge manager require zero technical knowledge.' },
  { q: 'How does the AI learn about my business?', a: 'Upload documents, paste your website URL for auto-crawling, or type FAQs directly. Your AI updates its knowledge instantly.' },
  { q: 'Can I use my own OpenAI API key?', a: 'Yes. You can bring your own API key for full control over model selection and costs, or use our managed AI infrastructure.' },
  { q: 'What CRMs and tools do you integrate with?', a: 'HubSpot, Salesforce, Zoho, Pipedrive, Slack, Microsoft Teams, WhatsApp, Google Workspace, and 50+ via webhooks.' },
  { q: 'Is my data secure?', a: 'Absolutely. We use AES-256 encryption at rest, TLS in transit, full tenant isolation, RBAC, and audit logs. SOC 2 Type II in progress.' },
  { q: 'What happens when the AI cannot answer?', a: 'The agent gracefully escalates to a human, captures the lead, or redirects to your contact page — all configurable.' },
  { q: 'Can I white-label the widget?', a: 'Yes, on Business and Enterprise plans. Full white-label with your logo, domain, and custom branding.' },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0)
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Calm blue question-themed background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50" />
      {/* Large question mark watermark */}
      <div className="absolute right-8 top-1/2 -translate-y-1/2 text-[28rem] font-black text-blue-50 leading-none select-none pointer-events-none">?</div>
      <div className="absolute left-4 bottom-8 text-[12rem] font-black text-blue-50 leading-none select-none pointer-events-none">?</div>

      <div className="relative max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-blue-700 bg-blue-100 rounded-full mb-4 uppercase tracking-widest">FAQ</span>
          <h2 className="text-4xl font-black text-slate-900 mb-4">Frequently Asked Questions</h2>
          <p className="text-slate-500">Still have questions? <a href="#contact" className="text-blue-600 hover:underline font-bold">Talk to us.</a></p>
        </motion.div>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}
              className={`bg-white rounded-xl border-2 overflow-hidden transition-all ${open === i ? 'border-blue-500 shadow-lg shadow-blue-100' : 'border-slate-100 hover:border-blue-200'}`}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left text-slate-900 font-bold hover:bg-blue-50/50 transition-colors text-sm"
              >
                {faq.q}
                <ChevronDown size={16} className={`flex-shrink-0 ml-4 transition-transform duration-200 ${open === i ? 'rotate-180 text-blue-600' : 'text-slate-400'}`} />
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }} className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-slate-500 text-sm leading-relaxed border-t border-blue-100 pt-3">{faq.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

