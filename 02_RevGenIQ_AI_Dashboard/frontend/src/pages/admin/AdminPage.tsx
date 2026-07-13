import { Shield } from 'lucide-react'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Admin</h1>
        <p className="text-slate-500 text-sm mt-1">Superadmin controls: tenants, subscriptions, audit logs</p>
      </div>
      <div className="flex items-center justify-center h-64 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
        <div className="text-center">
          <Shield size={32} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
          <p className="text-slate-500 text-sm">Platform admin panel coming soon</p>
        </div>
      </div>
    </div>
  )
}
