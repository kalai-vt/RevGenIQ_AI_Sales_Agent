import { motion } from 'framer-motion'
import { Globe, Database, Target, MessageSquare, Languages, Palette, BarChart3, Lightbulb, Mic, Layers, ShieldCheck, Cpu } from 'lucide-react'

const feats = [
  { icon: Globe, title: 'Website Crawler', desc: 'Auto-crawl and index your entire website as a knowledge source.', c: 'text-blue-600 bg-blue-50 border-blue-100' },
  { icon: Database, title: 'Knowledge Base', desc: 'Upload PDFs, docs, and FAQs. AI learns your business instantly.', c: 'text-red-600 bg-red-50 border-red-100' },
  { icon: Target, title: 'Lead Generation', desc: 'Capture name, email, phone and qualify leads automatically.', c: 'text-green-600 bg-green-50 border-green-100' },
  { icon: MessageSquare, title: 'Conversation Memory', desc: 'Full history retained. AI remembers context across sessions.', c: 'text-blue-600 bg-blue-50 border-blue-100' },
  { icon: Languages, title: 'Multi-language', desc: 'Respond in 50+ languages. Reach global audiences effortlessly.', c: 'text-red-600 bg-red-50 border-red-100' },
  { icon: Palette, title: 'Widget Builder', desc: 'No-code designer. Match your brand in seconds.', c: 'text-green-600 bg-green-50 border-green-100' },
  { icon: BarChart3, title: 'Analytics', desc: 'Deep insights on conversations, leads, and revenue attribution.', c: 'text-blue-600 bg-blue-50 border-blue-100' },
  { icon: Lightbulb, title: 'Intent Detection', desc: 'Understand what every visitor wants before they ask.', c: 'text-red-600 bg-red-50 border-red-100' },
  { icon: Cpu, title: 'RAG Engine', desc: 'Retrieval-Augmented Generation for accurate, grounded answers.', c: 'text-green-600 bg-green-50 border-green-100' },
  { icon: Mic, title: 'Voice Ready', desc: 'Voice input and output. Omnichannel AI experiences.', c: 'text-blue-600 bg-blue-50 border-blue-100' },
  { icon: Layers, title: 'Omnichannel', desc: 'Web, WhatsApp, Slack, Teams — one agent, everywhere.', c: 'text-red-600 bg-red-50 border-red-100' },
  { icon: ShieldCheck, title: 'Enterprise Security', desc: 'SOC 2, GDPR, RBAC, tenant isolation, and audit logs.', c: 'text-green-600 bg-green-50 border-green-100' },
]

export default function Features() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Dark navy tech background */}
      <div className="absolute inset-0 bg-slate-900" />
      {/* Circuit-board grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.08]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="circuit" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M0 40 H30 M50 40 H80 M40 0 V30 M40 50 V80" stroke="#60a5fa" strokeWidth="1" fill="none"/>
            <circle cx="40" cy="40" r="4" fill="none" stroke="#60a5fa" strokeWidth="1"/>
            <circle cx="0" cy="40" r="2" fill="#60a5fa"/>
            <circle cx="80" cy="40" r="2" fill="#60a5fa"/>
            <circle cx="40" cy="0" r="2" fill="#60a5fa"/>
            <circle cx="40" cy="80" r="2" fill="#60a5fa"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#circuit)" />
      </svg>
      {/* Colored glows */}
      <div className="absolute top-0 left-1/4 w-96 h-48 bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-48 bg-red-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-blue-300 bg-blue-900/50 rounded-full mb-4 uppercase tracking-widest border border-blue-700">Features</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Everything You Need to Win</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">Enterprise-grade AI capabilities, designed for speed and simplicity.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {feats.map((f, i) => {
            const Icon = f.icon
            const [tc, bg, border] = f.c.split(' ')
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }}
                className={`group flex items-start gap-3 p-4 rounded-xl border ${border} ${bg}/10 hover:${bg} hover:border-opacity-50 transition-all duration-200 cursor-default hover:scale-105`}
              >
                <div className={`w-9 h-9 rounded-lg ${bg} border ${border} flex items-center justify-center flex-shrink-0`}>
                  <Icon size={16} className={tc} />
                </div>
                <div>
                  <div className="text-white text-sm font-bold mb-0.5">{f.title}</div>
                  <div className="text-slate-400 text-xs leading-relaxed">{f.desc}</div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
