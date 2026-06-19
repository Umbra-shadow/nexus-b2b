export const metadata = { title: 'Policies' }

const sectionStyle = { marginBottom: 36 }
const headingStyle = { fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase' as const, color: 'var(--nx-fg-strong)', marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid var(--nx-border)' }
const bodyStyle = { fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg)', lineHeight: 1.75 }

export default function PoliciesPage() {
  return (
    <div>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-muted)', marginBottom: 28 }}>Last updated: June 2026 · Effective immediately</p>

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
          <div style={headingStyle}>3. Data retention and member deactivation</div>
          <p style={bodyStyle}>
            All session messages, deal transcripts, and receipt records are retained indefinitely as part of the business record — regardless of whether the individual team member is still active. When a team member is removed from a business by their admin, their account is deactivated, but all messages, sessions, and activity under that business remain on file. This ensures a complete and tamper-proof audit trail for every business relationship on the platform.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            Business account data is retained for the duration of the active registration plus 90 days after a confirmed deletion. Financial records (receipts, bank details) are retained for 7 years as required by financial record-keeping regulations.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>4. Request-based changes</div>
          <p style={bodyStyle}>
            NexusB2B operates on a request-based change model to protect the integrity of business profiles and the trust of all parties. The following actions require a formal request to the platform team:
          </p>
          <ul style={{ ...bodyStyle, paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Business profile updates</strong> — Changes to your company name, city, website, description, or banking details must be submitted as an update request. Your current profile remains live until the change is reviewed and approved.</li>
            <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Business account deletion</strong> — Deleting your registered business requires a formal deletion request. All data is preserved for audit purposes after deletion. The request will be reviewed before the account is deactivated.</li>
          </ul>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            The platform team aims to review all requests within 2 business days. You will be notified by email of the outcome. Requests may be rejected if they conflict with active deal sessions, compliance requirements, or platform policies.
          </p>
          <p style={{ ...bodyStyle, marginTop: 12 }}>
            <strong style={{ color: 'var(--nx-fg-strong)' }}>Before submitting an update request,</strong> ensure you have no open deal sessions. Profile changes during active negotiations can create conflicts. The platform will warn you if open sessions are detected when you initiate a request.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>5. Team member management</div>
          <p style={bodyStyle}>
            Business admins may invite and remove team members at their own discretion. Removing a team member deactivates their access immediately. However, all messages, deal sessions, and activity performed by that member under the business remain on record under the business name. This is not reversible — the historical record cannot be reassigned or deleted.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>6. Your rights</div>
          <div style={bodyStyle}>
            <p style={{ marginBottom: 12 }}>You have the following rights with respect to your personal data:</p>
            <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Access:</strong> Request a copy of all data we hold about you and your business.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Correction:</strong> Submit an update request through your account settings. Changes take effect upon platform approval.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Deletion:</strong> Submit a deletion request through your account settings. Retained financial and session records may not be immediately deletable per applicable law.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Portability:</strong> Receive your data in a structured, machine-readable format upon request.</li>
              <li><strong style={{ color: 'var(--nx-fg-strong)' }}>Objection:</strong> Object to processing of your data for direct marketing or profiling purposes.</li>
            </ul>
          </div>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>7. Security</div>
          <p style={bodyStyle}>
            All data is encrypted at rest using AES-256-GCM. Payment details (bank account numbers, SWIFT codes) are encrypted with a separate key that is never stored alongside the data. Connections are secured via TLS 1.3. We conduct periodic security audits and follow responsible disclosure practices.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>8. Cookies</div>
          <p style={bodyStyle}>
            We use strictly necessary session cookies to keep you authenticated and a single analytics cookie to understand aggregate usage patterns. We do not use advertising cookies or cross-site trackers. You may disable all non-essential cookies through your browser without impacting core functionality.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>9. Third-party services</div>
          <p style={bodyStyle}>
            NexusB2B uses the following sub-processors: cloud infrastructure (AWS / Azure), database services, and an AI provider for the Lummy mediation layer. Each sub-processor is contractually bound to data protection standards equivalent to or stricter than this policy. A full sub-processor list is available upon request.
          </p>
        </div>

        <div style={sectionStyle}>
          <div style={headingStyle}>10. Changes to this policy</div>
          <p style={bodyStyle}>
            Material changes to this policy will be communicated via email to all registered users at least 30 days before taking effect. Continued use of the platform after that date constitutes acceptance of the updated policy.
          </p>
        </div>

        <div>
          <div style={headingStyle}>11. Contact</div>
          <p style={bodyStyle}>
            Questions or data requests: <a href="mailto:legal@nexusb2b.io" style={{ color: '#c44b1b', textDecoration: 'none' }}>legal@nexusb2b.io</a>. We respond to data requests within 72 hours on business days.
          </p>
        </div>
      </div>
    </div>
  )
}
