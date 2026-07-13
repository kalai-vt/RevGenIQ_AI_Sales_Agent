import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { DASHBOARD_LOGIN_URL, DASHBOARD_SIGNUP_URL } from '../../config'

const nav = [
  { label: 'Platform', hash: 'platform' },
  { label: 'Solutions', hash: 'industries' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Docs', to: '/docs' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  // "Platform"/"Solutions" scroll to a section on the homepage. If we're
  // already home, just scroll; otherwise navigate home first and let Home's
  // hash-scroll effect (see pages/Home.tsx) handle it once the page mounts.
  function goToSection(hash: string) {
    setOpen(false)
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${hash}`)
    }
  }

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm' : 'bg-white/80 backdrop-blur-md'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center">
          <img src="/brand/wordmark.png" alt="RevGenIQ AI" className="h-12 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map((item) =>
            item.to ? (
              <Link key={item.label} to={item.to} className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                {item.label}
              </Link>
            ) : (
              <button key={item.label} onClick={() => goToSection(item.hash!)} className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                {item.label}
              </button>
            )
          )}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a href={DASHBOARD_LOGIN_URL} className="text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors px-3 py-2">Sign In</a>
          <a href={DASHBOARD_SIGNUP_URL} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-200">
            Start Free Trial
          </a>
        </div>

        <button className="md:hidden text-slate-500 hover:text-slate-800" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-slate-100"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {nav.map((item) =>
                item.to ? (
                  <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="py-3 text-slate-600 hover:text-blue-600 text-sm font-medium border-b border-slate-50">
                    {item.label}
                  </Link>
                ) : (
                  <button key={item.label} onClick={() => goToSection(item.hash!)} className="py-3 text-left text-slate-600 hover:text-blue-600 text-sm font-medium border-b border-slate-50">
                    {item.label}
                  </button>
                )
              )}
              <a href={DASHBOARD_LOGIN_URL} className="py-3 text-slate-600 text-sm font-medium border-b border-slate-50">Sign In</a>
              <a href={DASHBOARD_SIGNUP_URL} className="mt-3 py-3 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg">Start Free Trial</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
