import { motion } from 'framer-motion'
import { Check, Zap } from 'lucide-react'
import { DASHBOARD_SIGNUP_URL, SALES_EMAIL } from '../../config'

// Kept in lockstep with the dashboard's real plans (02_RevGenIQ_AI_Dashboard
// backend/main.py `_seed_plans`) — these are the actual billable tiers, not
// marketing-only numbers, so a visitor who signs up sees the same pricing
// here as in the dashboard's Billing page.
const plans = [
  {
    name: 'Starter', price: '₹1,999', period: '/mo', yearly: '₹19,990/year · save 17%',
    desc: 'Perfect for small businesses getting started with AI.',
    features: ['2,000 AI conversations/month', '1,000 leads captured', '3 team members', '100 MB knowledge base', 'AI chat widget', 'Widget customizer', 'Email support'],
    cta: 'Start Free Trial', highlight: false,
  },
  {
    name: 'Growth', price: '₹3,999', period: '/mo', yearly: '₹39,990/year · save 17%',
    desc: 'For growing teams that need more scale and insight.',
    features: ['15,000 AI conversations/month', '5,000 leads captured', '10 team members', '500 MB knowledge base', 'Everything in Starter', 'Analytics dashboard', 'Team management', 'Priority email support'],
    cta: 'Start Free Trial', highlight: true,
  },
  {
    name: 'Business', price: '₹5,999', period: '/mo', yearly: '₹59,990/year · save 17%',
    desc: 'Maximum scale and access for teams that need everything.',
    features: ['Unlimited AI conversations', 'Unlimited leads', 'Unlimited team members', '2 GB knowledge base', 'Everything in Growth', 'Advanced analytics', 'API access', 'White-label widget', 'Priority support'],
    cta: 'Start Free Trial', highlight: false,
  },
]

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 overflow-hidden">
      {/* Red/value themed background with money/grid pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-white to-red-50" />
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pricegrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
            <rect x="0" y="0" width="50" height="50" fill="none" stroke="#DC2626" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pricegrid)" />
      </svg>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-red-100/40 rounded-full blur-3xl" />
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-green-100/40 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 text-xs font-black text-red-700 bg-red-100 rounded-full mb-4 uppercase tracking-widest">Pricing</span>
          <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-slate-500 max-w-xl mx-auto text-lg">
            Choose the plan that fits your business. All prices in Indian Rupees (INR), inclusive of GST.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.08 }}
              className={`relative bg-white rounded-2xl p-6 flex flex-col transition-shadow ${
                plan.highlight
                  ? 'border-2 border-blue-600 shadow-2xl shadow-blue-100 scale-105'
                  : 'border-2 border-slate-100 hover:border-red-200 hover:shadow-lg'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white text-xs font-black rounded-full shadow-lg">
                  <Zap size={10} /> Most Popular
                </div>
              )}
              <div className="mb-6">
                <div className="text-slate-400 text-sm font-bold mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-black ${plan.highlight ? 'text-blue-600' : 'text-slate-900'}`}>{plan.price}</span>
                  <span className="text-slate-400 text-sm pb-1">{plan.period}</span>
                </div>
                <div className="text-slate-400 text-xs mb-2">{plan.yearly}</div>
                <p className="text-slate-400 text-sm">{plan.desc}</p>
              </div>
              <ul className="space-y-2.5 flex-1 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <Check size={14} className={`mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-blue-600' : 'text-green-600'}`} />
                    {f}
                  </li>
                ))}
              </ul>
              <a href={DASHBOARD_SIGNUP_URL} className={`block text-center py-3 rounded-xl font-black text-sm transition-all duration-200 ${
                plan.highlight ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200'
                : 'border-2 border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 hover:bg-blue-50'}`}>
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-slate-500 text-sm mt-10">
          Need something custom? <a href={`mailto:${SALES_EMAIL}`} className="text-blue-600 font-semibold hover:underline">Talk to sales</a>
        </p>
      </div>
    </section>
  )
}
