import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { useState } from 'react'
import { useSessionTimeout } from '@/hooks/useSessionTimeout'
import { SessionTimeoutModal } from '@/components/SessionTimeoutModal'

export function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { showWarning, secondsRemaining, stayLoggedIn, logoutNow } = useSessionTimeout()

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <Outlet />
          </div>
        </main>
      </div>

      <SessionTimeoutModal
        open={showWarning}
        secondsRemaining={secondsRemaining}
        onStayLoggedIn={stayLoggedIn}
        onLogoutNow={logoutNow}
      />
    </div>
  )
}
