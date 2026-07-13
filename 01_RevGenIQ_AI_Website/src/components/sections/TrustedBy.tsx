import { motion } from 'framer-motion'

const logos = ['Stripe','Shopify','HubSpot','Salesforce','Notion','Intercom','Linear','Vercel','Figma','Twilio','Zendesk','Atlassian']

export default function TrustedBy() {
  const doubled = [...logos, ...logos]
  return (
    <section className="relative py-16 overflow-hidden">
      {/* Blue-to-white horizontal gradient band */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600" />
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.15) 1px, transparent 1px, transparent 80px), repeating-linear-gradient(0deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 80px)' }} />
      <div className="relative max-w-7xl mx-auto px-6 mb-8 text-center">
        <p className="text-blue-100 text-sm font-bold uppercase tracking-widest">Trusted by world-class companies</p>
      </div>
      <div className="relative">
        <motion.div
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
          className="flex gap-12 items-center whitespace-nowrap"
        >
          {doubled.map((name, i) => (
            <div key={i} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors font-bold text-lg flex-shrink-0 select-none cursor-default">
              <div className="w-5 h-5 rounded bg-white/20" />
              {name}
            </div>
          ))}
        </motion.div>
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-blue-600 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-blue-600 to-transparent pointer-events-none" />
      </div>
    </section>
  )
}
