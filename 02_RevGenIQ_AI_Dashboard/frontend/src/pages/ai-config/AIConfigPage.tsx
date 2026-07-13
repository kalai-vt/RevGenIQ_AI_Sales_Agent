import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Bot, Brain, MessageSquareText, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

import { aiConfigApi, type AIConfig } from '@/services/api'
import { getErrorMessage } from '@/utils/getErrorMessage'

const MODEL_LABELS: Record<string, string> = {
  'gpt-4o-mini': 'GPT-4o mini (fast, low cost)',
  'gpt-4o': 'GPT-4o (most capable)',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo (cheapest)',
}

function Section({
  icon: Icon, title, description, children,
}: { icon: React.ElementType; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-4">
      <div>
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-semibold">
          <Icon size={18} /> {title}
        </div>
        <p className="text-slate-500 text-xs mt-1">{description}</p>
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}
        />
      </button>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  )
}

export default function AIConfigPage() {
  const queryClient = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['ai-config'],
    queryFn: () => aiConfigApi.get().then((r) => r.data),
  })

  const [form, setForm] = useState<AIConfig | null>(null)
  const current = form ?? config

  if (isLoading || !current) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-500 text-sm">Loading AI configuration...</p>
      </div>
    )
  }

  function update<K extends keyof AIConfig>(key: K, value: AIConfig[K]) {
    setForm({ ...current, [key]: value } as AIConfig)
  }

  async function save() {
    if (!form) return
    try {
      const { data } = await aiConfigApi.update(form)
      queryClient.setQueryData(['ai-config'], data)
      setForm(null)
      toast.success('AI configuration saved')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save AI configuration'))
    }
  }

  const models = current.supported_models?.length ? current.supported_models : Object.keys(MODEL_LABELS)

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Configuration</h1>
        <p className="text-slate-500 text-sm mt-1">Tune your AI agent's personality, instructions, and model settings</p>
      </div>

      <Section icon={Bot} title="Model & Personality" description="Controls how the agent generates responses.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Model</label>
            <select
              value={current.llm_model}
              onChange={(e) => update('llm_model', e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
            >
              {models.map((m) => (
                <option key={m} value={m}>{MODEL_LABELS[m] ?? m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Max response length (tokens)</label>
            <input
              type="number"
              min={50}
              max={4000}
              value={current.max_tokens}
              onChange={(e) => update('max_tokens', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
            />
          </div>
        </div>

        <div>
          <label className="flex items-center justify-between text-xs font-medium text-slate-500 mb-1.5">
            <span>Temperature (creativity)</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold">{current.temperature.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={current.temperature}
            onChange={(e) => update('temperature', Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>Focused &amp; consistent</span>
            <span>Creative &amp; varied</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">System prompt (additional instructions)</label>
          <textarea
            value={current.system_prompt ?? ''}
            onChange={(e) => update('system_prompt', e.target.value)}
            rows={3}
            placeholder="e.g. Always mention our 24/7 support line. Never discuss competitor pricing."
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Fallback message (shown if the AI fails to respond)</label>
          <input
            type="text"
            value={current.fallback_message ?? ''}
            onChange={(e) => update('fallback_message', e.target.value)}
            placeholder="I'm having trouble right now — please contact us directly."
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
          />
        </div>
      </Section>

      <Section icon={Brain} title="Knowledge Base & Memory" description="How much context the agent uses per reply.">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Knowledge chunks retrieved (RAG top-k)</label>
            <input
              type="number"
              min={1}
              max={20}
              value={current.rag_top_k}
              onChange={(e) => update('rag_top_k', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Conversation memory window (messages)</label>
            <input
              type="number"
              min={1}
              max={50}
              disabled={!current.enable_memory}
              value={current.memory_window}
              onChange={(e) => update('memory_window', Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent disabled:opacity-50"
            />
          </div>
        </div>
        <Toggle
          checked={current.enable_memory}
          onChange={(v) => update('enable_memory', v)}
          label="Remember earlier messages in the conversation"
        />
      </Section>

      <Section icon={UserPlus} title="Lead Capture" description="When the agent starts asking visitors for contact details.">
        <Toggle
          checked={current.enable_lead_capture}
          onChange={(v) => update('enable_lead_capture', v)}
          label="Enable lead capture"
        />
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Wait this many visitor messages before offering to collect contact info
          </label>
          <input
            type="number"
            min={0}
            max={20}
            disabled={!current.enable_lead_capture}
            value={current.lead_capture_after_messages}
            onChange={(e) => update('lead_capture_after_messages', Number(e.target.value))}
            className="w-32 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent disabled:opacity-50"
          />
        </div>
      </Section>

      <Section icon={MessageSquareText} title="Human Escalation" description="Notify your team when a conversation needs a human.">
        <Toggle
          checked={current.escalation_enabled}
          onChange={(v) => update('escalation_enabled', v)}
          label="Escalate complaints to a human via email"
        />
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">Escalation email</label>
          <input
            type="email"
            value={current.escalation_email ?? ''}
            onChange={(e) => update('escalation_email', e.target.value)}
            placeholder="support@yourcompany.com"
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-transparent"
          />
        </div>
        {current.escalation_enabled && !current.escalation_email && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
            <AlertTriangle size={14} /> An escalation email is required while escalation is enabled.
          </div>
        )}
      </Section>

      <button
        onClick={save}
        disabled={!form}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
      >
        Save changes
      </button>
    </div>
  )
}
