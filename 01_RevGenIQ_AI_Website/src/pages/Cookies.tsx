import LegalLayout from '../components/layout/LegalLayout'

export default function Cookies() {
  return (
    <LegalLayout
      title="Cookie Policy"
      lastUpdated="July 2026"
      intro="RevGenIQ AI's website and dashboard use a small amount of local browser storage — here's what and why."
      sections={[
        {
          heading: '1. What we use',
          body: (
            <p>
              We use browser <code>localStorage</code> (not tracking cookies) to keep you signed in to the dashboard
              and to remember an anonymous visitor/session identifier for the embeddable chat widget, so a
              conversation can continue across page loads.
            </p>
          ),
        },
        {
          heading: '2. What we don\'t do',
          body: <p>We don't use third-party advertising cookies or cross-site tracking pixels on this site or in the widget.</p>,
        },
        {
          heading: '3. Managing storage',
          body: <p>You can clear your browser's local storage for this site at any time from your browser's developer tools or site settings — this will simply sign you out and start a new widget session.</p>,
        },
      ]}
    />
  )
}
