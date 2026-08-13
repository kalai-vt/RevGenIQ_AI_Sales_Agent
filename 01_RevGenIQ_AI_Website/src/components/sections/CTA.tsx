import { motion } from 'framer-motion'
import { ArrowRight, Zap } from 'lucide-react'
import { DASHBOARD_SIGNUP_URL, SUPPORT_EMAIL } from '../../config'

export default function CTA() {
  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-500/20 rounded-full blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="relative max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-8 shadow-xl">
            <Zap size={28} className="text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
            Ready to Turn Visitors<br />
            <span className="text-yellow-300">Into Customers?</span>
          </h2>
          <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
            Join 10,000+ businesses using Sales IQ to automate revenue. Start free — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href={DASHBOARD_SIGNUP_URL} className="group flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl transition-all duration-200 shadow-2xl hover:shadow-white/20 hover:-translate-y-0.5 text-base">
              Start Free Trial — No Card Needed
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </a>
            <a href={`mailto:${SUPPORT_EMAIL}?subject=Book%20a%20demo`} className="flex items-center gap-2 px-8 py-4 text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 rounded-xl transition-all font-semibold text-base">
              Book a Demo
            </a>
          </div>
          <div className="mt-8 flex items-center justify-center gap-6 text-blue-200 text-sm">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" /> Free forever plan</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400 inline-block" /> No setup fees</span>
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Cancel anytime</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

