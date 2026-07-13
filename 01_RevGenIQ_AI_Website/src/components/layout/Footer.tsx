import { Link, useNavigate, useLocation } from 'react-router-dom'
import { X, Globe, GitFork } from 'lucide-react'
import { CONTACT_EMAIL } from '../../config'

const cols = [
  {
    title: 'Product',
    links: [
      { label: 'Platform', hash: 'platform' },
      { label: 'Pricing', to: '/pricing' },
      { label: 'Changelog', to: '/changelog' },
      { label: 'Roadmap', to: '/roadmap' },
      { label: 'Status', to: '/status' },
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
  const navigate = useNavigate()
  const location = useLocation()

  function goToSection(hash: string) {
    if (location.pathname === '/') {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(`/#${hash}`)
    }
  }

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-12">
          <div className="col-span-2">
            <Link to="/" className="flex items-center mb-5">
              <img src="/brand/wordmark.png" alt="RevGenIQ AI" className="h-12 w-auto" />
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs mb-6">
              AI Agents That Drive Revenue. Turn every visitor into your next customer.
            </p>
            <div className="flex items-center gap-3">
              {[X, Globe, GitFork].map((Icon, i) => (
                <a key={i} href={`mailto:${CONTACT_EMAIL}`} className="w-8 h-8 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 transition-colors shadow-sm">
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>
          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-slate-900 text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    {'hash' in link ? (
                      <button onClick={() => goToSection(link.hash!)} className="text-slate-500 hover:text-blue-600 text-sm transition-colors text-left">
                        {link.label}
                      </button>
                    ) : (
                      <Link to={link.to!} className="text-slate-500 hover:text-blue-600 text-sm transition-colors">
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">2026 RevGenIQ AI, Inc. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <Link to="/status" className="text-slate-400 text-xs hover:text-blue-600 transition-colors">All systems operational</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
