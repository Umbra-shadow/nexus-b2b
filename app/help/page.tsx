'use client'

import Link from 'next/link'
import { MarketingShell } from '@/components/marketing/MarketingShell'

export default function HelpPage() {
  const resources = [
    {
      category: 'Getting Started',
      icon: '🚀',
      items: [
        { title: 'Sign up and verify your business', desc: 'Complete verification in minutes. Submit documents once, unlock the platform.' },
        { title: 'Set up your profile', desc: 'Add your business info, agents, and contact details. Your profile is your identity on NexusB2B.' },
        { title: 'Invite an agent', desc: 'Delegate session management to trusted team members. Agents can open sessions on your behalf.' },
      ],
    },
    {
      category: 'Platform Features',
      icon: '⚡',
      items: [
        { title: 'Discovery: Find verified partners', desc: 'Search by industry, location, or criteria. NexusB2B parses natural language to match you with relevant businesses.' },
        { title: 'Sessions: Structured deal talks', desc: 'Open a session, invite another verified business, exchange messages, and sign off on terms.' },
        { title: 'Receipts: Immutable proof of record', desc: 'Every session generates a cryptographically signed receipt. Download and store receipts as proof of agreement.' },
        { title: 'Verification: Identity confidence', desc: 'NexusB2B verifies businesses once. Partner with confidence knowing everyone on the platform is real.' },
      ],
    },
    {
      category: 'Data & Security',
      icon: '🔒',
      items: [
        { title: 'What data do you collect?', desc: 'We collect your business info, session metadata, and encrypted receipts. We never sell data. Read our privacy policy.' },
        { title: 'How is my data encrypted?', desc: 'Sensitive data (bank details, encrypted receipts) uses AES-256-GCM. Passwords are bcrypt cost-12. All data is encrypted in transit and at rest.' },
        { title: 'Can I export my data?', desc: 'Yes. Download all receipts as a PDF from Settings > Data, or request a full export from support@nexusb2b.io.' },
        { title: 'How do I delete my account?', desc: 'Go to Settings > Account > Danger Zone and click "Delete Account Fully." This is irreversible and data purges within 30 days.' },
      ],
    },
    {
      category: 'Billing & Plans',
      icon: '💳',
      items: [
        { title: 'Is NexusB2B free?', desc: 'Yes, NexusB2B is currently in demo. Full features are available at no cost for beta users.' },
        { title: 'What happens when you launch paid plans?', desc: 'We&apos;ll announce pricing and tiers in advance. Existing verified users will have a grace period to upgrade.' },
        { title: 'Do you offer enterprise accounts?', desc: 'Yes. Email partnerships@nexusb2b.io for custom limits, API access, and SLAs.' },
      ],
    },
  ]

  return (
    <MarketingShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <header style={{ padding: '72px 0 48px', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 24 }}>/ Resources</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px,8vw,108px)', lineHeight: 0.88, color: 'var(--nx-fg-strong)', marginBottom: 28, textTransform: 'uppercase' }}>
            Help <span style={{ color: '#c44b1b' }}>Center</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.7, color: 'var(--nx-muted)', maxWidth: 720 }}>
            Learn how to use NexusB2B, from onboarding to advanced features. Explore guides, security practices, and billing information.
          </p>
        </header>

        <div style={{ padding: '48px 0 80px', animation: 'nx-rise 0.4s ease' }}>
          {resources.map((section, sectionIdx) => (
            <div key={section.category} style={{ marginBottom: 56 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
                <span style={{ fontSize: 32 }}>{section.icon}</span>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--nx-fg-strong)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                  {section.category}
                </h2>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }} className="nx-help-grid">
                {section.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    style={{
                      border: '1px solid var(--nx-border)',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      transition: 'all 0.2s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--nx-raised)'
                      e.currentTarget.style.borderColor = '#c44b1b'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none'
                      e.currentTarget.style.borderColor = 'var(--nx-border)'
                    }}
                  >
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>
                      {item.title}
                    </div>
                    <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--nx-muted)', margin: 0 }}>
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* API Section */}
          <div style={{ marginTop: 56, padding: '32px', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <span style={{ fontSize: 32 }}>⚙️</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--nx-fg-strong)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                API Access
              </h2>
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.7, color: 'var(--nx-muted)', marginBottom: 18 }}>
              NexusB2B provides a REST API for enterprise integrations. Access discovery endpoints, session management, and receipt retrieval programmatically.
            </p>
            <a
              href="mailto:partners@nexusb2b.io?subject=API%20Access%20Request"
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                background: '#c44b1b',
                color: 'white',
                border: 'none',
                padding: '12px 22px',
                cursor: 'pointer',
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              Request API Access →
            </a>
          </div>

          {/* Quick nav */}
          <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, textAlign: 'center' }} className="nx-help-footer">
            <Link
              href="/support"
              style={{
                padding: '24px',
                border: '1px solid var(--nx-border)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 24 }}>?</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>
                FAQ
              </span>
            </Link>
            <Link
              href="/contact"
              style={{
                padding: '24px',
                border: '1px solid var(--nx-border)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 24 }}>📧</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>
                Contact
              </span>
            </Link>
            <a
              href="https://status.nexusb2b.io"
              style={{
                padding: '24px',
                border: '1px solid var(--nx-border)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span style={{ fontSize: 24 }}>📊</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>
                Status
              </span>
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px) {
          .nx-help-grid { grid-template-columns: 1fr !important; }
          .nx-help-footer { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </MarketingShell>
  )
}
