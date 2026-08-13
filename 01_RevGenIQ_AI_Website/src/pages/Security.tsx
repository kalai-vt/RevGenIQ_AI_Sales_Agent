import LegalLayout from '../components/layout/LegalLayout'
import { SUPPORT_EMAIL } from '../config'

export default function Security() {
  return (
    <LegalLayout
      title="Security"
      lastUpdated="July 2026"
      intro="An overview of how we protect your data and your customers' conversations."
      sections={[
        {
          heading: '1. Data isolation',
          body: <p>Every workspace's knowledge base, conversations, and leads are scoped by tenant at the database and vector-search layer — one customer's data is never used to answer another customer's questions.</p>,
        },
        {
          heading: '2. Encryption',
          body: <p>Data is encrypted in transit via TLS. Passwords are hashed, never stored in plain text. Authentication uses short-lived access tokens with refresh rotation.</p>,
        },
        {
          heading: '3. Widget security',
          body: <p>The public embeddable widget is scoped to a single, non-guessable widget key and runs inside an isolated Shadow DOM so it can't be affected by, or interfere with, the host page's scripts or styles.</p>,
        },
        {
          heading: '4. Access control',
          body: <p>Dashboard access is role-based (Owner, Admin, Sales, Support, Viewer) so team members only see what's relevant to their role.</p>,
        },
        {
          heading: '5. Reporting a concern',
          body: <p>If you believe you've found a security issue, please email <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a> with details — we take reports seriously and will respond promptly.</p>,
        },
      ]}
    />
  )
}
