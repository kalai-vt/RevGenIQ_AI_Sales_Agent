import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Palette, Shield, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'

import { widgetSettingsApi, type WidgetSettings } from '@/services/api'
import { getErrorMessage } from '@/utils/getErrorMessage'

// The widget loader is served by the backend, not the dashboard frontend —
// on a real client site there is no dev-server proxy, so the snippet needs
// the backend's actual origin. VITE_API_URL lets this be set explicitly in
// production; the dev fallback assumes the documented `uvicorn --port 8000`.
const API_ORIGIN =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  `${window.location.protocol}//${window.location.hostname}:8000`

export default function WidgetBuilderPage() {
  const queryClient = useQueryClient()
  const [copied, setCopied] = useState(false)

  const { data: settings, isLoading } = useQuery({
    queryKey: ['widget-settings'],
    queryFn: () => widgetSettingsApi.get().then((r) => r.data),
  })

  const [form, setForm] = useState<Partial<WidgetSettings> | null>(null)
  const [newDomain, setNewDomain] = useState('')
  const current = form ?? settings

  if (isLoading || !current) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Loading widget settings...</p>
      </div>
    )
  }

  const snippet = `<script src="${API_ORIGIN}/widget/v1/loader.js" data-widget-key="${current.widget_key}" async></script>`
  const allowedDomains = current.allowed_domains ?? []

  function addDomain() {
    const domain = newDomain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!domain || allowedDomains.includes(domain)) return
    update('allowed_domains', [...allowedDomains, domain])
    setNewDomain('')
  }

  function removeDomain(domain: string) {
    update('allowed_domains', allowedDomains.filter((d) => d !== domain))
  }

  function update<K extends keyof WidgetSettings>(key: K, value: WidgetSettings[K]) {
    setForm({ ...current, [key]: value })
  }

  async function save() {
    if (!form) return
    try {
      const { data } = await widgetSettingsApi.update(form)
      queryClient.setQueryData(['widget-settings'], data)
      setForm(null)
      toast.success('Widget settings saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save widget settings'))
    }
  }

  function copySnippet() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Widget Builder</h1>
        <p className="text-slate-500 text-sm mt-1">Customize your chat widget and install it on your website</p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
          <Palette size={18} /> Appearance
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Agent name</label>
            <input
              type="text"
              value={current.agent_name}
              onChange={(e) => update('agent_name', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Position</label>
            <select
              value={current.position}
              onChange={(e) => update('position', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
            >
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Primary color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={current.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="w-9 h-9 rounded border border-slate-200 dark:border-slate-700 bg-transparent"
              />
              <input
                type="text"
                value={current.primary_color}
                onChange={(e) => update('primary_color', e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Placeholder text</label>
            <input
              type="text"
              value={current.placeholder_text}
              onChange={(e) => update('placeholder_text', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Welcome message</label>
          <textarea
            value={current.welcome_message ?? ''}
            onChange={(e) => update('welcome_message', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent resize-none"
          />
        </div>

        <button
          onClick={save}
          disabled={!form}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Save changes
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
        <div className="text-slate-900 dark:text-white font-semibold">Install on your website</div>
        <p className="text-slate-500 text-sm">
          Paste this snippet before the closing <code>&lt;/body&gt;</code> tag of any page you want the widget on.
        </p>
        <div className="relative">
          <pre className="bg-slate-950 text-emerald-400 text-xs rounded-lg p-4 overflow-x-auto">{snippet}</pre>
          <button
            onClick={copySnippet}
            className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md transition-colors"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
          <Shield size={18} /> Allowed domains
        </div>
        <p className="text-slate-500 text-sm">
          Restrict your widget key to only work on these domains. Leave empty to allow it on any site — useful while testing, but worth locking down once you're live.
        </p>
        <div className="flex flex-wrap gap-2">
          {allowedDomains.map((domain) => (
            <span
              key={domain}
              className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full"
            >
              {domain}
              <button onClick={() => removeDomain(domain)} className="hover:text-red-600 transition-colors">
                <X size={12} />
              </button>
            </span>
          ))}
          {allowedDomains.length === 0 && (
            <span className="text-slate-400 text-xs italic">No restrictions — works on any domain</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addDomain())}
            placeholder="example.com"
            className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
          />
          <button
            onClick={addDomain}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        <button
          onClick={save}
          disabled={!form}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Save changes
        </button>
      </div>
    </div>
  )
}
