import { motion } from 'framer-motion'
import { Bot, HeadphonesIcon, Megaphone, Brain, BarChart3, Users } from 'lucide-react'

const products = [
  { icon: Bot, title: 'AI Sales Agent', desc: 'Qualify leads, answer product questions, and close deals 24/7.', bg: 'bg-blue-600', tag: 'bg-blue-100 text-blue-700', tagLabel: 'Revenue', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
  { icon: HeadphonesIcon, title: 'AI Support Agent', desc: 'Resolve 80% of support tickets instantly with context-aware responses.', bg: 'bg-red-500', tag: 'bg-red-100 text-red-700', tagLabel: 'Support', hover: 'hover:border-red-300 hover:shadow-red-100' },
  { icon: Megaphone, title: 'AI Marketing Agent', desc: 'Personalise campaigns, nurture leads, and re-engage customers automatically.', bg: 'bg-green-600', tag: 'bg-green-100 text-green-700', tagLabel: 'Growth', hover: 'hover:border-green-300 hover:shadow-green-100' },
  { icon: Brain, title: 'Knowledge AI', desc: 'Train your AI on docs, website, and FAQs. Knowledge that evolves instantly.', bg: 'bg-blue-600', tag: 'bg-blue-100 text-blue-700', tagLabel: 'Intelligence', hover: 'hover:border-blue-300 hover:shadow-blue-100' },
  { icon: BarChart3, title: 'Analytics', desc: 'Real-time dashboards for conversation insights, lead scores, and revenue.', bg: 'bg-red-500', tag: 'bg-red-100 text-red-700', tagLabel: 'Insights', hover: 'hover:border-red-300 hover:shadow-red-100' },
  { icon: Users, title: 'CRM Integration', desc: 'Sync leads and deal data to HubSpot, Salesforce, and 50+ tools instantly.', bg: 'bg-green-600', tag: 'bg-green-100 text-green-700', tagLabel: 'Integrations', hover: 'hover:border-green-300 hover:shadow-green-100' },
]

export default function ProductOverview() {
  return (
    <section id="platform" className="relative py-24 overflow-hidden">
      {/* Light blue diagonal stripe background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="diag" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <line x1="0" y1="0" x2="0" y2="40" stroke="#2563EB" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#diag)" />
      </svg>
      {/* Blue accent circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-100 rounded-full blur-3xl opacity-60 -translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-blue-700 bg-blue-100 rounded-full mb-4 uppercase tracking-widest">Platform</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">One Platform. Every AI Agent You Need.</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">From first hello to closed deal — Sales IQ agents work together to maximise revenue.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p, i) => {
            const Icon = p.icon
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                className={`group bg-white border-2 border-slate-100 rounded-2xl p-6 ${p.hover} hover:shadow-xl transition-all duration-300 cursor-pointer`}
              >
                <div className={`w-12 h-12 rounded-xl ${p.bg} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={22} className="text-white" />
                </div>
                <span className={`inline-block px-2.5 py-0.5 text-[11px] font-black ${p.tag} rounded-full mb-3 uppercase tracking-wide`}>{p.tagLabel}</span>
                <h3 className="text-slate-900 font-black text-lg mb-2">{p.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

