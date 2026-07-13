import { motion } from 'framer-motion'
import PageShell from '../components/layout/PageShell'

const endpoint = 'https://revgeniq-ai-backend.vercel.app'

const widgetEndpoints = [
  { method: 'GET', path: '/widget/v1/config/{widget_key}', desc: 'Fetch your widget\'s theme, welcome message, and suggested questions.' },
  { method: 'POST', path: '/widget/v1/chat', desc: 'Send a visitor message and get back the AI agent\'s structured response (message, cards, actions, suggestions).' },
  { method: 'POST', path: '/widget/v1/lead', desc: 'Submit a Quote/Demo/Contact form — creates a lead visible in your dashboard\'s Leads tab.' },
]

export default function Docs() {
  return (
    <PageShell eyebrow="Documentation" title="Docs" subtitle="Everything you need to embed and configure your AI agent.">
      <div className="max-w-3xl mx-auto space-y-16">
        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Getting started</h2>
          <ol className="space-y-4 text-slate-600 leading-relaxed list-decimal list-inside">
            <li>Create your workspace and choose your industry — this sets your AI agent's persona automatically.</li>
            <li>Add your knowledge base under <strong>Knowledge Base</strong> (upload documents, add FAQs, or crawl your website).</li>
            <li>Grab your embed snippet from <strong>Widget Builder</strong> in the dashboard — it includes your unique widget key.</li>
            <li>Paste the snippet before <code>&lt;/body&gt;</code> on any page of your site.</li>
          </ol>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Embed snippet</h2>
          <p className="text-slate-500 mb-4">
            The widget is a single self-contained script — it reads its own <code>data-widget-key</code> attribute, so
            the same snippet works unmodified on any page:
          </p>
          <pre className="bg-slate-900 text-slate-100 text-xs rounded-xl p-5 overflow-x-auto">
{`<script
  src="${endpoint}/widget/v1/loader.js"
  data-widget-key="YOUR-WIDGET-KEY"
  async
></script>`}
          </pre>
        </motion.section>

        <motion.section id="api-reference" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="scroll-mt-24">
          <h2 className="text-2xl font-black text-slate-900 mb-2">API Reference</h2>
          <p className="text-slate-500 mb-6">
            The widget's public API (no login required — identified by your <code>widget_key</code>) is what the
            embed snippet calls. Full authenticated REST API access to your dashboard data is available on the
            Business plan — email <a href="mailto:sales@revgeniq.ai" className="text-blue-600 hover:underline">sales@revgeniq.ai</a> for API credentials.
          </p>
          <div className="space-y-3">
            {widgetEndpoints.map((e) => (
              <div key={e.path} className="border-2 border-slate-100 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-1.5">
                  <span className={`text-xs font-black px-2 py-0.5 rounded ${e.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {e.method}
                  </span>
                  <code className="text-sm text-slate-800 font-mono">{e.path}</code>
                </div>
                <p className="text-slate-500 text-sm">{e.desc}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Need more help?</h2>
          <p className="text-slate-500">
            Check the <a href="/tutorials" className="text-blue-600 hover:underline">Tutorials</a> for step-by-step guides, or{' '}
            <a href="mailto:support@revgeniq.ai" className="text-blue-600 hover:underline">email support</a>.
          </p>
        </motion.section>
      </div>
    </PageShell>
  )
}
