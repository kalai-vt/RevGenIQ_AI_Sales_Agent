import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { User, Building2, LogOut } from 'lucide-react'
import { useAuthStore } from '@/app/store'

interface UserMenuProps {
  children: (props: { onClick: () => void }) => React.ReactNode
  align?: 'left' | 'right'
  direction?: 'up' | 'down'
}

/** Dropdown shared by the Sidebar's bottom user block and the TopBar's user
 * button — both trigger the same menu rather than duplicating it. */
export function UserMenu({ children, align = 'right', direction = 'down' }: UserMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { logout } = useAuthStore()

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function go(path: string) {
    setOpen(false)
    navigate(path)
  }

  function handleLogout() {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <div ref={ref} className="relative">
      {children({ onClick: () => setOpen((v) => !v) })}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12 }}
            className={`absolute ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'} w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl py-1.5 z-50`}
          >
            <button
              onClick={() => go('/settings?tab=profile')}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <User size={15} /> My Profile
            </button>
            <button
              onClick={() => go('/settings?tab=organization')}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <Building2 size={15} /> Organization Settings
            </button>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <LogOut size={15} /> Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
