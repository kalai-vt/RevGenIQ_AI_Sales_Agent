import { motion } from 'framer-motion'
import { ArrowRight, Mail, Phone, MessageCircle, Bot, Receipt } from 'lucide-react'
import { Link } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import ProductsShowcase from '../components/sections/ProductsShowcase'
import { SUPPORT_EMAIL, PHONE_DISPLAY, PHONE_HREF, WHATSAPP_URL, SALES_IQ_PATH, BILL_IQ_PATH } from '../config'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        {/* Company hero */}
        <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden pt-20 bg-[#020617]">
          <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.5" fill="#60A5FA" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
          <div className="absolute top-[-100px] left-[-100px] w-[700px] h-[700px] bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[-150px] right-[-100px] w-[600px] h-[600px] bg-red-600/10 rounded-full blur-3xl" />

          <div className="relative max-w-5xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 text-sm font-semibold mb-8"
            >
              revgenai.in
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6 text-white"
            >
              Business software<br />that runs itself.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
            >
              RevGenAI builds focused software for two jobs every business has: winning customers and
              billing them. Sales IQ handles the first with AI agents. Bill IQ handles the second at the counter.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <a href="#products" className="group flex items-center gap-2 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/40 hover:-translate-y-0.5">
                Explore Products <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </a>
              <Link to="/contact" className="flex items-center gap-2 px-7 py-3.5 text-white border border-white/20 hover:border-white/40 hover:bg-white/5 rounded-xl transition-all font-medium">
                Talk to Us
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Two products, quick preview cards linking into hero for scannability */}
        <section className="py-6" />
        <ProductsShowcase id="products" />

        {/* Why RevGenAI */}
        <section className="py-24 bg-slate-50">
          <div className="max-w-6xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <span className="inline-block px-3 py-1 text-xs font-black text-red-700 bg-red-100 rounded-full mb-4 uppercase tracking-widest">Why RevGenAI</span>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">One company, built for Indian businesses.</h2>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Bot, title: 'Purpose-built products', desc: 'Sales IQ and Bill IQ each solve one job well, instead of one bloated suite trying to do everything.' },
                { icon: Receipt, title: 'Priced in rupees, for India', desc: 'Transparent INR pricing, GST-ready billing, and support that understands local business needs.' },
                { icon: MessageCircle, title: 'Real people on WhatsApp', desc: 'Reach us by phone, WhatsApp, or email — a real support team, not just a ticket queue.' },
              ].map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="bg-white border-2 border-slate-100 rounded-2xl p-6"
                >
                  <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center mb-4">
                    <f.icon size={20} className="text-white" />
                  </div>
                  <h3 className="text-slate-900 font-black text-lg mb-2">{f.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact band */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-6 text-center">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
              <h2 className="text-4xl md:text-5xl font-black text-white mb-6 leading-tight">Talk to RevGenAI</h2>
              <p className="text-blue-100 text-lg max-w-xl mx-auto mb-10">
                Questions about Sales IQ or Bill IQ? Reach us any of these ways — we typically reply the same day.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 px-6 py-3.5 bg-white text-blue-700 font-bold rounded-xl transition-all shadow-2xl hover:-translate-y-0.5 text-sm">
                  <Mail size={16} /> {SUPPORT_EMAIL}
                </a>
                <a href={PHONE_HREF} className="flex items-center gap-2 px-6 py-3.5 text-white border-2 border-white/30 hover:border-white/60 hover:bg-white/10 rounded-xl transition-all font-semibold text-sm">
                  <Phone size={16} /> {PHONE_DISPLAY}
                </a>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-6 py-3.5 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl transition-all shadow-lg text-sm">
                  <MessageCircle size={16} /> WhatsApp
                </a>
              </div>
              <div className="mt-10 flex items-center justify-center gap-6 text-sm">
                <Link to={SALES_IQ_PATH} className="text-blue-100 hover:text-white underline underline-offset-4">Sales IQ specs</Link>
                <Link to={BILL_IQ_PATH} className="text-blue-100 hover:text-white underline underline-offset-4">Bill IQ specs</Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
