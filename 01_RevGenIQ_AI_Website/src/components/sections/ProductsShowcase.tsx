import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Receipt, Check } from 'lucide-react'
import { SALES_IQ_PATH, BILL_IQ_PATH } from '../../config'

const productList = [
  {
    icon: Bot,
    name: 'Sales IQ',
    tagline: 'AI Sales, Marketing & Support',
    desc: 'AI agents that qualify leads, answer product questions, and resolve support tickets — turning every visitor into a customer, 24/7.',
    bullets: ['AI chat widget for your website', 'Lead capture synced to your CRM', 'Real-time analytics dashboard'],
    to: SALES_IQ_PATH,
    accent: 'from-blue-600 to-blue-700',
    chip: 'bg-blue-100 text-blue-700',
    ring: 'hover:border-blue-300 hover:shadow-blue-100',
  },
  {
    icon: Receipt,
    name: 'Bill IQ',
    tagline: 'Billing, POS & Inventory',
    desc: 'Cloud billing and point-of-sale for retail stores, restaurants, and pharmacies — checkout, stock, customers, and vendors in one place.',
    bullets: ['Fast checkout with barcode scanning', 'Multi-branch inventory tracking', 'WhatsApp bill delivery, no printer needed'],
    to: BILL_IQ_PATH,
    accent: 'from-red-600 to-red-700',
    chip: 'bg-red-100 text-red-700',
    ring: 'hover:border-red-300 hover:shadow-red-100',
  },
]

interface ProductsShowcaseProps {
  id?: string
}

export default function ProductsShowcase({ id = 'products' }: ProductsShowcaseProps) {
  return (
    <section id={id} className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50" />
      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-blue-700 bg-blue-100 rounded-full mb-4 uppercase tracking-widest">Products</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Two products. One goal: run your business better.</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">Pick a product below to see full features, pricing, and specifications.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {productList.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`group bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col ${p.ring} hover:shadow-2xl transition-all duration-300`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.accent} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <p.icon size={26} className="text-white" />
              </div>
              <span className={`inline-block w-fit px-2.5 py-0.5 text-[11px] font-black ${p.chip} rounded-full mb-3 uppercase tracking-wide`}>{p.tagline}</span>
              <h3 className="text-slate-900 font-black text-2xl mb-3">{p.name}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">{p.desc}</p>
              <ul className="space-y-2.5 mb-8 flex-1">
                {p.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check size={14} className="mt-0.5 flex-shrink-0 text-green-600" />
                    {b}
                  </li>
                ))}
              </ul>
              <Link
                to={p.to}
                className="group/btn inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
              >
                View {p.name} details <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
