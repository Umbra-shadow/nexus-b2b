export const metadata = { title: 'Policies' }

const sectionStyle = { marginBottom: 36 }
const headingStyle = { fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--nx-fg-strong)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--nx-border)' }
const bodyStyle = { fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg)', lineHeight: 1.75 }

export default function PoliciesPage() {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-muted)', marginBottom: 28 }}>Last updated: January 2026 · Effective immediately</p>

      <div style={{ border: '1px solid var(--nx-border)', padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 0 }}>

        <div style={sectionStyle}>
          <div style={headingStyle}>1. What we collect</div>
          <p style={bodyStyle}>
            NexusB2B collects information you provide directly: your name, business email address, company registration details, and payment information when you configure receipts. We also collect usage data including pages visited, session activity, and API calls made to our platform. This data is used exclusively to operate the service and improve your experience.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>2. How we use your data</div>
          <p style={bodyStyle}>
            Your data is used to: authenticate your account, power the discovery engine, facilitate business sessions, process and display receipts, and generate AI-mediated introductions through our Lummy system. We do not sell your data to third parties. We do not use your business communications to train AI models without explicit consent.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>3. Data retention</div>
          <p style={bodyStyle}>
            Account data is retained for the duration of your active account plus 90 days after deletion. Session messages and receipts are retained for 7 years as required by financial record-keeping regulations in most jurisdictions. You may request early deletion of non-financial records at any time.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>4. Your rights</div>
          <div style={bodyStyle}>
            <p style={{ marginBottom: 12 }}>You have the following rights with respect to your personal data:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Access:</strong> Request a copy of all data we hold about you and your business.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Correction:</strong> Update inaccurate information through your account settings at any time.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Deletion:</strong> Request deletion of your account. Retained financial records may not be immediately deletable per applicable law.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Portability:</strong> Receive your data in a structured, machine-readable format upon request.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Objection:</strong> Object to processing of your data for direct marketing or profiling purposes.</li>
            </ul>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>5. Security</div>
          <p style={bodyStyle}>
            All data is encrypted at rest using AES-256-GCM. Payment details (bank account numbers, SWIFT codes) are encrypted with a separate key that is never stored alongside the data. Connections are secured via TLS 1.3. We conduct periodic security audits and follow responsible disclosure practices.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>6. Cookies</div>
          <p style={bodyStyle}>
            We use strictly necessary session cookies to keep you authenticated and a single analytics cookie to understand aggregate usage patterns. We do not use advertising cookies or cross-site trackers. You may disable all non-essential cookies through your browser without impacting core functionality.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>7. Third-party services</div>
          <p style={bodyStyle}>
            NexusB2B uses the following sub-processors: cloud infrastructure (AWS / Azure), database services, and an AI provider for the Lummy mediation layer. Each sub-processor is contractually bound to data protection standards equivalent to or stricter than this policy. A full sub-processor list is available upon request.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>8. Changes to this policy</div>
          <p style={bodyStyle}>
            Material changes to this policy will be communicated via email to all registered users at least 30 days before taking effect. Continued use of the platform after that date constitutes acceptance of the updated policy.
          </p>
        </div>

        <div>
          <div style={headingStyle}>9. Contact</div>
          <p style={bodyStyle}>
            Questions or data requests: <a href="mailto:legal@nexusb2b.io" style={{ color: '#c44b1b', textDecoration: 'none' }}>legal@nexusb2b.io</a>. We respond to data requests within 72 hours on business days.
          </p>
        </div>
      </div>
    </div>
  )
}
