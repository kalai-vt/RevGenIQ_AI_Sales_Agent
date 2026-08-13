import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, Bot, TrendingUp, Users, Zap } from 'lucide-react'
import { DASHBOARD_SIGNUP_URL, SUPPORT_EMAIL } from '../../config'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 bg-white">
      {/* Neural network dot pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.5" fill="#2563EB" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Animated gradient blobs */}
      <div className="absolute top-[-100px] left-[-100px] w-[700px] h-[700px] bg-blue-200/40 rounded-full blur-3xl" />
      <div className="absolute top-[20%] right-[-150px] w-[500px] h-[500px] bg-red-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-[-100px] left-[30%] w-[500px] h-[500px] bg-green-200/30 rounded-full blur-3xl" />

      {/* Diagonal accent line top-right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] opacity-10"
        style={{ background: 'conic-gradient(from 135deg at 100% 0%, #2563EB, #DC2626, #16a34a, transparent)' }} />

      <div className="relative max-w-7xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-sm font-semibold mb-8"
        >
          <Sparkles size={14} />
          Sales IQ by RevGenAI
          <ArrowRight size={12} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] mb-6"
        >
          <span className="text-slate-900">AI Agents That</span><br />
          <span className="bg-gradient-to-r from-blue-600 via-red-500 to-green-600 bg-clip-text text-transparent">Drive Revenue</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Deploy intelligent Sales, Marketing and Support AI agents in minutes.
          Turn every visitor into your next customer — no code required.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <a href={DASHBOARD_SIGNUP_URL} className="group flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 hover:-translate-y-0.5">
            Start Free Trial <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </a>
          <a href="#platform" className="flex items-center gap-2 px-7 py-3.5 text-red-600 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 rounded-xl transition-all font-bold">
            <Play size={16} className="fill-red-500 text-red-500" /> Watch Demo
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Book%20a%20demo`} className="flex items-center gap-2 px-7 py-3.5 text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 rounded-xl transition-all font-medium">
            Book a Demo
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap items-center justify-center gap-10 mb-20"
        >
          {[
            { val: '10k+', label: 'Businesses', color: 'text-blue-600' },
            { val: '340%', label: 'Avg Conversion Lift', color: 'text-red-500' },
            { val: '2M+', label: 'Leads Captured', color: 'text-green-600' },
            { val: '99.9%', label: 'Uptime SLA', color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className={`text-3xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-sm text-slate-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="relative max-w-3xl mx-auto"
        >
          <div className="bg-white rounded-2xl p-6 shadow-2xl shadow-blue-100/60 border-2 border-blue-100">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow">
                <Zap size={14} className="text-white" />
              </div>
              <div className="text-left">
                <div className="text-slate-900 text-sm font-bold">Sales IQ Agent</div>
                <div className="text-green-600 text-xs flex items-center gap-1 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
                  Online · Powered by GPT-4o
                </div>
              </div>
              <div className="ml-auto flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
            </div>
            <div className="space-y-3 text-left mb-4">
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl rounded-tl-none px-4 py-3 text-slate-700 text-sm max-w-xs">
                  Hi! I am your AI Sales Agent. What product are you interested in today?
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <div className="bg-slate-100 rounded-xl rounded-tr-none px-4 py-3 text-slate-700 text-sm max-w-xs">
                  I need an enterprise plan for our 200-person team.
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot size={12} className="text-white" />
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl rounded-tl-none px-4 py-3 text-slate-700 text-sm max-w-sm">
                  Perfect! Our Business plan at ₹5,999/mo includes unlimited conversations, advanced analytics, and API access. Want me to set up a demo?
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-4">
              <div className="flex gap-1">
                {[0,150,300].map(d => <span key={d} className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
              AI is typing...
            </div>
            <div className="flex flex-wrap gap-2">
              {['Book a demo', 'See pricing', 'Talk to sales'].map((p) => (
                <button key={p} className="px-3 py-1.5 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 rounded-lg transition-colors font-semibold">{p}</button>
              ))}
            </div>
          </div>
          <motion.div animate={{ y: [0,-8,0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -top-5 -left-6 bg-white border-2 border-green-100 rounded-xl px-4 py-2.5 shadow-lg hidden sm:flex items-center gap-2">
            <TrendingUp size={14} className="text-green-600" />
            <span className="text-slate-800 text-sm font-bold">+340% Revenue</span>
          </motion.div>
          <motion.div animate={{ y: [0,8,0] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            className="absolute -bottom-5 -right-6 bg-white border-2 border-red-100 rounded-xl px-4 py-2.5 shadow-lg hidden sm:flex items-center gap-2">
            <Users size={14} className="text-red-500" />
            <span className="text-slate-800 text-sm font-bold">2M+ Leads Captured</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

