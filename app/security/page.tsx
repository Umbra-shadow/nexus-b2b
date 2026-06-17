import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, FeatureRows, StatStrip, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Security',
  description: 'How NexusB2B protects your business data: identity verification, encrypted sensitive fields, scoped access, and secure sessions.',
}

export default function SecurityPage() {
  return (
    <InfoPage
      eyebrow="/ Trust / Security"
      title="Security"
      accentWord="First"
      lede="Security is not a feature bolted onto NexusB2B — it is the architecture. From verified identity at the door to encrypted financial fields, every layer is built to keep your business data protected."
    >
      <StatStrip
        stats={[
          { value: 'AES-256', label: 'Field encryption', accent: true },
          { value: 'bcrypt', label: 'Password hashing' },
          { value: 'JWT', label: 'Scoped sessions' },
        ]}
      />

      <div style={{ marginTop: 64 }}>
        <SectionTitle>How we protect data</SectionTitle>
        <FeatureRows
          items={[
            { title: 'Verified identity at entry', body: 'Every account belongs to a checked legal entity, eliminating the anonymous accounts that drive most platform fraud.' },
            { title: 'Encrypted sensitive fields', body: 'Sensitive commercial details such as banking information are encrypted at rest with authenticated AES-256-GCM encryption.' },
            { title: 'Hashed credentials', body: 'Passwords are never stored in plain text. They are hashed with bcrypt using a strong work factor.' },
            { title: 'Scoped access control', body: 'Every request is authenticated and authorized against the requesting business. Data is filtered so companies only ever see their own records and the sessions they are party to.' },
            { title: 'Parameterized queries', body: 'All database access uses parameterized queries, closing off SQL injection as an attack vector.' },
            { title: 'Role-based permissions', body: 'Within a business, admins and agents have different capabilities, so sensitive actions stay with the right people.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>Responsible disclosure</SectionTitle>
        <Prose>
          <p>
            We welcome reports from security researchers. If you believe you have found a vulnerability, please email
            <strong style={{ color: 'var(--nx-fg-strong)' }}> security@nexusb2b.io</strong> with details and steps to
            reproduce. We ask that you give us a reasonable window to investigate and remediate before any public
            disclosure.
          </p>
          <p>
            <em>NexusB2B is a demonstration build; the security model described here reflects how the platform is
            implemented for evaluation.</em>
          </p>
        </Prose>
      </div>

      <CtaBand heading="Security questions?" sub="Reach our security team at security@nexusb2b.io for documentation or disclosure." />
    </InfoPage>
  )
}
