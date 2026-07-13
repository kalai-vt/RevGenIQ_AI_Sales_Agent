import { motion } from 'framer-motion'
import { UserPlus, Brain, Code2, Rocket } from 'lucide-react'

const steps = [
  { icon: UserPlus, num: 1, title: 'Sign Up Free', desc: 'Create your account in 30 seconds. No credit card required.', color: 'bg-blue-600', ring: 'ring-blue-200', numColor: 'text-blue-600 border-blue-200' },
  { icon: Brain, num: 2, title: 'Train Your AI', desc: 'Upload docs, connect your website, add FAQs in minutes.', color: 'bg-red-500', ring: 'ring-red-200', numColor: 'text-red-500 border-red-200' },
  { icon: Code2, num: 3, title: 'Embed Widget', desc: 'One line of code. Fully customisable to match your brand.', color: 'bg-green-600', ring: 'ring-green-200', numColor: 'text-green-600 border-green-200' },
  { icon: Rocket, num: 4, title: 'Go Live', desc: 'Watch leads pour in, tickets shrink, and revenue grow.', color: 'bg-blue-600', ring: 'ring-blue-200', numColor: 'text-blue-600 border-blue-200' },
]

export default function HowItWorks() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Green growth-themed gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-green-50" />
      {/* Upward arrow pattern — symbolising growth */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="arrows" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M30 50 L30 10 M20 20 L30 10 L40 20" stroke="#16a34a" strokeWidth="2" fill="none" strokeLinecap="round" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arrows)" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-green-100/50 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-green-700 bg-green-100 rounded-full mb-4 uppercase tracking-widest">How It Works</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Up and Running in Minutes</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Four simple steps from zero to a fully autonomous AI agent on your website.</p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connector line */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-300 via-red-300 to-green-300" />
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative text-center group"
              >
                <div className={`relative inline-flex items-center justify-center w-20 h-20 rounded-2xl ${step.color} shadow-xl ring-4 ${step.ring} mb-6 group-hover:scale-110 transition-transform duration-300 mx-auto`}>
                  <Icon size={28} className="text-white" />
                  <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 ${step.numColor} text-[10px] font-black flex items-center justify-center shadow-md`}>{step.num}</span>
                </div>
                <h3 className="text-slate-900 font-black text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
