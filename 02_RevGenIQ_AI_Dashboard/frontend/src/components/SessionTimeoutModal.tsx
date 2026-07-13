import { AnimatePresence, motion } from 'framer-motion'
import { Clock } from 'lucide-react'

interface Props {
  open: boolean
  secondsRemaining: number
  onStayLoggedIn: () => void
  onLogoutNow: () => void
}

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function SessionTimeoutModal({ open, secondsRemaining, onStayLoggedIn, onLogoutNow }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          role="alertdialog" aria-modal="true" aria-labelledby="session-timeout-title"
        >
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm border border-slate-200 dark:border-slate-700 p-6 text-center"
          >
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
              <Clock size={22} className="text-amber-600 dark:text-amber-400" />
            </div>
            <h2 id="session-timeout-title" className="font-bold text-slate-900 dark:text-white text-lg mb-1.5">
              Your session will expire in {formatCountdown(secondsRemaining)} due to inactivity
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              You'll be logged out automatically unless you choose to stay.
            </p>
            <div className="flex gap-3">
              <button
                onClick={onLogoutNow}
                className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Logout Now
              </button>
              <button
                onClick={onStayLoggedIn}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-colors"
              >
                Stay Logged In
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
