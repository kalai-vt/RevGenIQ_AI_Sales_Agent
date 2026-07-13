import LegalLayout from '../components/layout/LegalLayout'
import { CONTACT_EMAIL } from '../config'

export default function Gdpr() {
  return (
    <LegalLayout
      title="GDPR"
      lastUpdated="July 2026"
      intro="Information for customers and website visitors in the EU/EEA regarding data protection rights."
      sections={[
        {
          heading: '1. Our role',
          body: <p>For data you control as a customer (your knowledge base, your visitors' conversations), we act as a data processor. For your own account data, we act as the data controller.</p>,
        },
        {
          heading: '2. Your rights',
          body: <p>Access, correction, deletion, portability, and objection to processing — available by emailing <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a>. We aim to respond within 30 days.</p>,
        },
        {
          heading: '3. Data transfers',
          body: <p>Our infrastructure providers may process data outside the EU/EEA under standard contractual clauses or equivalent safeguards.</p>,
        },
        {
          heading: '4. Data retention',
          body: <p>We retain account and conversation data for as long as your workspace is active, plus a reasonable period after cancellation for legal and billing purposes, unless you request earlier deletion.</p>,
        },
      ]}
    />
  )
}
