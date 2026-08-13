import { motion } from 'framer-motion'

const integrations = [
  { name: 'OpenAI', color: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' },
  { name: 'HubSpot', color: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' },
  { name: 'Salesforce', color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' },
  { name: 'Zoho', color: 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100' },
  { name: 'Slack', color: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' },
  { name: 'MS Teams', color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' },
  { name: 'Google', color: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100' },
  { name: 'WhatsApp', color: 'bg-green-50 border-green-300 text-green-700 hover:bg-green-100' },
  { name: 'Webhooks', color: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100' },
  { name: 'Zapier', color: 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100' },
  { name: 'Pipedrive', color: 'bg-green-50 border-green-300 text-green-600 hover:bg-green-100' },
  { name: 'REST API', color: 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100' },
]

export default function Integrations() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Connection/network themed background */}
      <div className="absolute inset-0 bg-slate-900" />
      <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="hexgrid" x="0" y="0" width="60" height="52" patternUnits="userSpaceOnUse">
            <polygon points="30,2 58,17 58,47 30,62 2,47 2,17" fill="none" stroke="#3b82f6" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hexgrid)" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-48 h-48 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-red-500/10 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-blue-300 bg-blue-900/60 rounded-full mb-4 uppercase tracking-widest border border-blue-700">Integrations</span>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">Connects With Your Stack</h2>
          <p className="text-slate-400 max-w-xl mx-auto text-lg">Plug Sales IQ into the tools you already use — no rip and replace.</p>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {integrations.map((item, i) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}
              className={`px-5 py-3 rounded-xl border-2 font-bold text-sm cursor-default transition-all duration-200 hover:scale-110 hover:shadow-lg ${item.color}`}
            >
              {item.name}
            </motion.div>
          ))}
        </div>
        <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center text-slate-500 text-sm">
          + 50 more integrations via REST API and webhooks
        </motion.p>
      </div>
    </section>
  )
}

