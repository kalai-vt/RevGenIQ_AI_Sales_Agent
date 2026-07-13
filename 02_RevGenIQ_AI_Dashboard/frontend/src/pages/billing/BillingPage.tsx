import { motion } from 'framer-motion'
import { Check, Zap, Rocket, Crown } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    price_monthly: 1999,
    price_yearly: 19990,
    icon: Zap,
    color: 'emerald',
    description: 'Perfect for small businesses getting started with AI',
    features: [
      '2,000 AI conversations/month',
      '1,000 leads captured',
      '3 team members',
      '100 MB knowledge base',
      'AI chat widget',
      'Widget customizer',
      'Email support',
    ],
  },
  {
    name: 'Growth',
    price_monthly: 3999,
    price_yearly: 39990,
    icon: Rocket,
    color: 'blue',
    popular: true,
    description: 'For growing teams that need more scale and insight',
    features: [
      '15,000 AI conversations/month',
      '5,000 leads captured',
      '10 team members',
      '500 MB knowledge base',
      'Everything in Starter',
      'Analytics dashboard',
      'Team management',
      'Priority email support',
    ],
  },
  {
    name: 'Business',
    price_monthly: 5999,
    price_yearly: 59990,
    icon: Crown,
    color: 'violet',
    description: 'Maximum scale and access for teams that need everything',
    features: [
      'Unlimited AI conversations',
      'Unlimited leads',
      'Unlimited team members',
      '2 GB knowledge base',
      'Everything in Growth',
      'Advanced analytics',
      'API access',
      'White-label widget',
      'Priority support',
    ],
  },
]

const COLOR_MAP: Record<string, { badge: string; btn: string; icon: string }> = {
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
    btn:   'bg-emerald-600 hover:bg-emerald-500 text-white',
    icon:  'text-emerald-500',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
    btn:   'bg-blue-600 hover:bg-blue-500 text-white',
    icon:  'text-blue-500',
  },
  violet: {
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400',
    btn:   'bg-violet-600 hover:bg-violet-500 text-white',
    icon:  'text-violet-500',
  },
}

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing & Plans</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Choose the plan that fits your business. All prices in Indian Rupees (INR), inclusive of GST.
        </p>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {PLANS.map((plan, i) => {
          const c = COLOR_MAP[plan.color]
          const Icon = plan.icon
          return (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`relative bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-card ${
                plan.popular
                  ? 'border-blue-400 dark:border-blue-600 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-full shadow">
                  MOST POPULAR
                </span>
              )}

              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${c.icon}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-500">{plan.description}</p>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-slate-900 dark:text-white">
                    ₹{plan.price_monthly.toLocaleString('en-IN')}
                  </span>
                  <span className="text-slate-400 text-sm mb-1">/month</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  ₹{plan.price_yearly.toLocaleString('en-IN')}/year · save{' '}
                  {Math.round((1 - plan.price_yearly / (plan.price_monthly * 12)) * 100)}%
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <Check size={14} className={`mt-0.5 flex-shrink-0 ${c.icon}`} />
                    {f}
                  </li>
                ))}
              </ul>

              <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${c.btn}`}>
                Upgrade to {plan.name}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Current plan / usage section placeholder */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 max-w-3xl shadow-card">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Current plan</h3>
        <p className="text-xs text-slate-400 mb-4">You are on the free trial. Upgrade to unlock full access.</p>
        <div className="space-y-3">
          {[
            { label: 'Conversations', used: 47, max: 100 },
            { label: 'Leads', used: 12, max: 50 },
          ].map((u) => (
            <div key={u.label}>
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>{u.label}</span>
                <span>{u.used} / {u.max}</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${(u.used / u.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
