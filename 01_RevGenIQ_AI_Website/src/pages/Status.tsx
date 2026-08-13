import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import PageShell from '../components/layout/PageShell'

type ServiceStatus = 'checking' | 'operational' | 'down'

interface Service {
  name: string
  desc: string
  check?: string
}

const services: Service[] = [
  { name: 'Marketing Website', desc: 'This site', check: undefined },
  { name: 'API & Widget Backend', desc: 'Chat, leads, and dashboard API', check: 'https://revgeniq-ai-backend.vercel.app/health' },
  { name: 'Customer Dashboard', desc: 'Analytics, knowledge base, team management', check: undefined },
]

export default function Status() {
  const [statuses, setStatuses] = useState<Record<string, ServiceStatus>>({})

  useEffect(() => {
    services.forEach((s) => {
      if (!s.check) {
        setStatuses((prev) => ({ ...prev, [s.name]: 'operational' }))
        return
      }
      setStatuses((prev) => ({ ...prev, [s.name]: 'checking' }))
      fetch(s.check)
        .then((r) => setStatuses((prev) => ({ ...prev, [s.name]: r.ok ? 'operational' : 'down' })))
        .catch(() => setStatuses((prev) => ({ ...prev, [s.name]: 'down' })))
    })
  }, [])

  const allOperational = services.every((s) => (statuses[s.name] ?? 'checking') === 'operational')

  return (
    <PageShell eyebrow="Status" title="System Status" subtitle="Live status of RevGenAI services.">
      <div className={`max-w-2xl mx-auto mb-8 rounded-2xl p-5 flex items-center gap-3 ${
        allOperational ? 'bg-green-50 border-2 border-green-200' : 'bg-amber-50 border-2 border-amber-200'
      }`}>
        {allOperational ? <CheckCircle2 className="text-green-600" size={22} /> : <Loader2 className="text-amber-600 animate-spin" size={22} />}
        <span className={`font-bold ${allOperational ? 'text-green-700' : 'text-amber-700'}`}>
          {allOperational ? 'All systems operational' : 'Checking service status...'}
        </span>
      </div>

      <div className="max-w-2xl mx-auto space-y-3">
        {services.map((s, i) => {
          const status = statuses[s.name] ?? 'checking'
          return (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between border-2 border-slate-100 rounded-xl px-5 py-4"
            >
              <div>
                <p className="font-semibold text-slate-900 text-sm">{s.name}</p>
                <p className="text-slate-400 text-xs">{s.desc}</p>
              </div>
              {status === 'checking' && <Loader2 size={18} className="text-slate-400 animate-spin" />}
              {status === 'operational' && <span className="flex items-center gap-1.5 text-green-600 text-xs font-bold"><CheckCircle2 size={15} /> Operational</span>}
              {status === 'down' && <span className="flex items-center gap-1.5 text-red-600 text-xs font-bold"><XCircle size={15} /> Degraded</span>}
            </motion.div>
          )
        })}
      </div>
    </PageShell>
  )
}
