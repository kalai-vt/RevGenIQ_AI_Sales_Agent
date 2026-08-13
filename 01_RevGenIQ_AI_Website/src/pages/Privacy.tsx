import LegalLayout from '../components/layout/LegalLayout'
import { SUPPORT_EMAIL } from '../config'

export default function Privacy() {
  return (
    <LegalLayout
      title="Privacy Policy"
      lastUpdated="July 2026"
      intro="This policy explains what information RevGenAI collects when you use our website, dashboard, and embeddable chat widget, and how we use it."
      sections={[
        {
          heading: '1. What we collect',
          body: (
            <p>
              Account information you provide (name, email, company), workspace configuration, knowledge base
              content you upload, and conversations your website visitors have with your AI widget. We also collect
              basic usage analytics (page views, feature usage) to improve the product.
            </p>
          ),
        },
        {
          heading: '2. How we use it',
          body: (
            <p>
              To operate the service (running your AI agent, storing your knowledge base, showing your analytics),
              to communicate with you about your account, and to improve the platform. We do not sell customer data.
            </p>
          ),
        },
        {
          heading: '3. Tenant data isolation',
          body: (
            <p>
              Each workspace's knowledge base and conversations are stored and retrieved separately from every other
              workspace. We do not use one customer's data to answer another customer's questions.
            </p>
          ),
        },
        {
          heading: '4. Third parties',
          body: (
            <p>
              We use OpenAI to process chat messages and generate responses, and a managed Postgres provider to
              store data. Both act strictly as data processors under our instruction.
            </p>
          ),
        },
        {
          heading: '5. Your rights',
          body: (
            <p>
              You can request a copy of, correction to, or deletion of your data at any time by contacting{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a>.
            </p>
          ),
        },
        {
          heading: '6. Contact',
          body: (
            <p>
              Questions about this policy: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a>
            </p>
          ),
        },
      ]}
    />
  )
}
