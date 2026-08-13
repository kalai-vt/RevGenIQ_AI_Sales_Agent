import { Link } from 'react-router-dom'
import { Mail, Phone, MessageCircle } from 'lucide-react'
import { SUPPORT_EMAIL, PHONE_DISPLAY, PHONE_HREF, WHATSAPP_URL, SALES_IQ_PATH, BILL_IQ_PATH } from '../../config'

const cols = [
  {
    title: 'Products',
    links: [
      { label: 'Sales IQ', to: SALES_IQ_PATH },
      { label: 'Bill IQ', to: BILL_IQ_PATH },
      { label: 'All Products', to: '/products' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Changelog', to: '/changelog' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Blog', to: '/blog' },
      { label: 'Careers', to: '/careers' },
      { label: 'Press', to: '/press' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Documentation', to: '/docs' },
      { label: 'API Reference', to: '/docs#api-reference' },
      { label: 'Community', to: '/community' },
      { label: 'Tutorials', to: '/tutorials' },
      { label: 'Templates', to: '/templates' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', to: '/privacy' },
      { label: 'Terms', to: '/terms' },
      { label: 'Security', to: '/security' },
      { label: 'GDPR', to: '/gdpr' },
      { label: 'Cookies', to: '/cookies' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-baseline gap-0.5 select-none mb-5">
              <span className="text-2xl font-black tracking-tight text-slate-900">RevGen</span>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-red-500 bg-clip-text text-transparent">AI</span>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              Business software that runs itself. Sales IQ for revenue, Bill IQ for the counter.
            </p>
            <ul className="space-y-2.5">
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm transition-colors">
                  <Mail size={14} className="text-slate-400" /> {SUPPORT_EMAIL}
                </a>
              </li>
              <li>
                <a href={PHONE_HREF} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 text-sm transition-colors">
                  <Phone size={14} className="text-slate-400" /> {PHONE_DISPLAY}
                </a>
              </li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-slate-500 hover:text-green-600 text-sm transition-colors">
                  <MessageCircle size={14} className="text-slate-400" /> WhatsApp us
                </a>
              </li>
            </ul>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-slate-900 text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-slate-500 hover:text-blue-600 text-sm transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">&copy; 2026 RevGenAI. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <Link to="/status" className="text-slate-400 text-xs hover:text-blue-600 transition-colors">All systems operational</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
