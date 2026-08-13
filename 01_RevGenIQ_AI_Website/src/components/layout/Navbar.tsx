import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, ChevronDown, Receipt, Bot } from 'lucide-react'
import { DASHBOARD_LOGIN_URL, BILL_IQ_LOGIN_URL, SALES_IQ_PATH, BILL_IQ_PATH } from '../../config'

const products = [
  { label: 'Sales IQ', to: SALES_IQ_PATH, desc: 'AI sales & support agents', icon: Bot },
  { label: 'Bill IQ', to: BILL_IQ_PATH, desc: 'Billing, POS & inventory', icon: Receipt },
]

const signIns = [
  { label: 'Sales IQ', href: DASHBOARD_LOGIN_URL, icon: Bot },
  { label: 'Bill IQ', href: BILL_IQ_LOGIN_URL, icon: Receipt },
]

const nav = [
  { label: 'Products', to: '/products' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Docs', to: '/docs' },
  { label: 'Contact', to: '/contact' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [signInOpen, setSignInOpen] = useState(false)
  const navigate = useNavigate()
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const signInCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  function openProducts() {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setProductsOpen(true)
  }
  function scheduleCloseProducts() {
    closeTimer.current = setTimeout(() => setProductsOpen(false), 150)
  }

  function openSignIn() {
    if (signInCloseTimer.current) clearTimeout(signInCloseTimer.current)
    setSignInOpen(true)
  }
  function scheduleCloseSignIn() {
    signInCloseTimer.current = setTimeout(() => setSignInOpen(false), 150)
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
        <Link to="/" className="flex items-baseline gap-0.5 select-none">
          <span className="text-2xl font-black tracking-tight text-slate-900">RevGen</span>
          <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">AI</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <div className="relative" onMouseEnter={openProducts} onMouseLeave={scheduleCloseProducts}>
            <button
              onClick={() => navigate('/products')}
              className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium flex items-center gap-1"
              aria-expanded={productsOpen}
            >
              Products <ChevronDown size={14} className={`transition-transform ${productsOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 pt-2 w-72"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2">
                    {products.map((p) => (
                      <Link
                        key={p.label}
                        to={p.to}
                        onClick={() => setProductsOpen(false)}
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors"
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0">
                          <p.icon size={16} />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{p.label}</div>
                          <div className="text-xs text-slate-500">{p.desc}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {nav.slice(1).map((item) => (
            <Link key={item.label} to={item.to} className="px-4 py-2 text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <div className="relative" onMouseEnter={openSignIn} onMouseLeave={scheduleCloseSignIn}>
            <button
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors px-3 py-2"
              aria-expanded={signInOpen}
            >
              Sign In <ChevronDown size={13} className={`transition-transform ${signInOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {signInOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.15 }}
                  className="absolute top-full right-0 pt-2 w-48"
                >
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xl p-2">
                    {signIns.map((s) => (
                      <a key={s.label} href={s.href} className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-blue-50 transition-colors text-sm font-medium text-slate-700">
                        <s.icon size={15} className="text-slate-500" /> {s.label}
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Link to="/products" className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-md shadow-blue-200">
            Get Started
          </Link>
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
              <div className="pt-2 pb-1 text-xs font-black uppercase tracking-widest text-slate-400">Products</div>
              {products.map((p) => (
                <Link key={p.label} to={p.to} onClick={() => setOpen(false)} className="flex items-center gap-3 py-2.5 text-slate-600 hover:text-blue-600 text-sm font-medium border-b border-slate-50">
                  <p.icon size={15} /> {p.label}
                </Link>
              ))}
              {nav.slice(1).map((item) => (
                <Link key={item.label} to={item.to} onClick={() => setOpen(false)} className="py-3 text-slate-600 hover:text-blue-600 text-sm font-medium border-b border-slate-50">
                  {item.label}
                </Link>
              ))}
              <div className="pt-2 pb-1 text-xs font-black uppercase tracking-widest text-slate-400">Sign In</div>
              {signIns.map((s) => (
                <a key={s.label} href={s.href} className="flex items-center gap-3 py-2.5 text-slate-600 hover:text-blue-600 text-sm font-medium border-b border-slate-50">
                  <s.icon size={15} /> {s.label}
                </a>
              ))}
              <Link to="/products" onClick={() => setOpen(false)} className="mt-3 py-3 text-center text-sm font-semibold text-white bg-blue-600 rounded-lg">Get Started</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
