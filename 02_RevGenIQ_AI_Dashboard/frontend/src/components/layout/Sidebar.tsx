import { NavLink } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BookOpen, MessageSquare, Users, BarChart3,
  Palette, Bot, UserCog, CreditCard, Shield, ChevronLeft,
  ChevronRight, Settings, Building2,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useAuthStore } from '@/app/store'
import { UserMenu } from './UserMenu'

const NAV_ITEMS = [
  { group: 'Overview',
    items: [
      { to: '/dashboard',      icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/analytics',      icon: BarChart3,       label: 'Analytics' },
    ],
  },
  { group: 'AI & Knowledge',
    items: [
      { to: '/knowledge',      icon: BookOpen,   label: 'Knowledge Base' },
      { to: '/ai-config',      icon: Bot,        label: 'AI Config' },
      { to: '/widget-builder', icon: Palette,    label: 'Widget Builder' },
    ],
  },
  { group: 'CRM',
    items: [
      { to: '/conversations',  icon: MessageSquare, label: 'Conversations' },
      { to: '/leads',          icon: Users,          label: 'Leads' },
    ],
  },
  { group: 'Workspace',
    items: [
      { to: '/team',     icon: UserCog,   label: 'Team' },
      { to: '/billing',  icon: CreditCard,label: 'Billing' },
    ],
  },
]

interface SidebarProps {
  open: boolean
  onToggle: () => void
}

export function Sidebar({ open, onToggle }: SidebarProps) {
  const { user, workspace } = useAuthStore()

  return (
    <motion.aside
      animate={{ width: open ? 240 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <img src="/brand/icon-light.png" alt="" className="w-10 h-10 rounded-lg flex-shrink-0 shadow-glow dark:hidden" />
          <img src="/brand/icon-dark.png" alt="" className="w-10 h-10 rounded-lg flex-shrink-0 shadow-glow hidden dark:block" />
          <AnimatePresence>
            {open && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.15 }}
                className="text-lg font-bold text-slate-900 dark:text-white whitespace-nowrap"
              >
                RevGenIQ AI
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Workspace badge */}
      {workspace && open && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Building2 size={14} className="text-emerald-500 flex-shrink-0" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
              {workspace.name}
            </span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            {open && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {group.group}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                      isActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    )
                  }
                  title={!open ? label : undefined}
                >
                  <Icon size={18} className="flex-shrink-0" />
                  <AnimatePresence>
                    {open && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className="whitespace-nowrap"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User menu */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        {user && (
          <UserMenu direction="up" align="left">
            {({ onClick }) => (
              <button
                onClick={onClick}
                className={clsx(
                  'flex items-center gap-3 w-full px-2 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                  open && 'bg-slate-50 dark:bg-slate-800'
                )}
                title={!open ? (user.full_name || user.email) : undefined}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {(user.full_name || user.email || 'U').charAt(0).toUpperCase() || 'U'}
                </div>
                {open && (
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user.full_name || 'User'}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                  </div>
                )}
              </button>
            )}
          </UserMenu>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow z-30"
      >
        {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </motion.aside>
  )
}
