import { motion } from 'framer-motion'
import { Factory, Heart, GraduationCap, Home, Code2, DollarSign, ShoppingBag } from 'lucide-react'

const industries = [
  { icon: Factory, name: 'Manufacturing', desc: 'Automate B2B sales inquiries and technical support for complex products.', color: 'bg-blue-600', glow: 'shadow-blue-200' },
  { icon: Heart, name: 'Healthcare', desc: 'Answer patient queries, book appointments, and support insurance 24/7.', color: 'bg-red-500', glow: 'shadow-red-200' },
  { icon: GraduationCap, name: 'Education', desc: 'Guide prospective students and answer admissions questions instantly.', color: 'bg-green-600', glow: 'shadow-green-200' },
  { icon: Home, name: 'Real Estate', desc: 'Qualify buyers, schedule viewings, and capture rental leads automatically.', color: 'bg-blue-600', glow: 'shadow-blue-200' },
  { icon: Code2, name: 'SaaS', desc: 'Convert trial users, reduce churn, and provide instant product support.', color: 'bg-red-500', glow: 'shadow-red-200' },
  { icon: DollarSign, name: 'Finance', desc: 'Explain products and capture qualified leads in compliance-safe chats.', color: 'bg-green-600', glow: 'shadow-green-200' },
  { icon: ShoppingBag, name: 'Retail', desc: 'Drive product discovery, reduce cart abandonment, handle returns.', color: 'bg-blue-600', glow: 'shadow-blue-200' },
]

export default function Industries() {
  return (
    <section id="industries" className="relative py-24 overflow-hidden">
      {/* World-map dot pattern — global reach theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="worlddots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="1.5" fill="#DC2626" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#worlddots)" />
      </svg>
      {/* Red accent blobs — industry/market theme */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-red-100/60 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-blue-100/60 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-red-700 bg-red-100 rounded-full mb-4 uppercase tracking-widest">Industries</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Built for Every Industry</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Pre-built knowledge templates and trained conversation flows for your sector.</p>
        </motion.div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {industries.map((ind, i) => {
            const Icon = ind.icon
            return (
              <motion.div
                key={ind.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
                className="group text-center p-6 rounded-2xl bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all duration-300 cursor-default"
              >
                <div className={`w-16 h-16 rounded-2xl ${ind.color} flex items-center justify-center mx-auto mb-4 shadow-xl ${ind.glow} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={26} className="text-white" />
                </div>
                <h3 className="text-slate-900 font-black mb-1.5">{ind.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{ind.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
