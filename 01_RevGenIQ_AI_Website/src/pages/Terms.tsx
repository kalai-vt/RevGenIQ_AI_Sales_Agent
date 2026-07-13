import LegalLayout from '../components/layout/LegalLayout'
import { CONTACT_EMAIL } from '../config'

export default function Terms() {
  return (
    <LegalLayout
      title="Terms of Service"
      lastUpdated="July 2026"
      intro="These terms govern your use of the RevGenIQ AI website, dashboard, and widget."
      sections={[
        {
          heading: '1. Using the service',
          body: <p>You must provide accurate account information and are responsible for activity under your workspace, including content added to your knowledge base and configuration of your AI agent.</p>,
        },
        {
          heading: '2. Plans and billing',
          body: <p>Paid plans (Starter, Growth, Business) are billed monthly or yearly as selected at signup. Pricing and limits for each plan are shown on our Pricing page and in your dashboard's Billing section.</p>,
        },
        {
          heading: '3. Acceptable use',
          body: <p>You may not use the platform to deploy an AI agent that impersonates a person, spreads misinformation, or violates applicable law. We may suspend accounts that violate this.</p>,
        },
        {
          heading: '4. AI-generated responses',
          body: <p>Your AI agent's responses are generated from your knowledge base and configuration. You are responsible for reviewing that your knowledge base and instructions produce accurate, appropriate responses for your business and industry.</p>,
        },
        {
          heading: '5. Termination',
          body: <p>You may cancel your subscription at any time from the Billing page. We may suspend or terminate accounts for violation of these terms.</p>,
        },
        {
          heading: '6. Contact',
          body: <p>Questions about these terms: <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-600 hover:underline">{CONTACT_EMAIL}</a></p>,
        },
      ]}
    />
  )
}
