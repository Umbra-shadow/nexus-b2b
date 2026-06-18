'use client'

import { useState } from 'react'
import { MarketingShell } from '@/components/marketing/MarketingShell'

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const faqs = [
    {
      q: 'How do I verify my business on NexusB2B?',
      a: "Navigate to your business profile and submit official documentation (business license, tax ID, incorporation papers). Our team reviews submissions within 24–48 hours. Once verified, you'll unlock features like advanced discovery filters and receipt generation.",
    },
    {
      q: 'What does a "receipt" represent in a session?',
      a: 'A receipt is a cryptographically signed record of a business interaction—proof that two parties met, discussed terms, and agreed on outcomes. Receipts are encrypted with AES-256-GCM and can only be decrypted by the session initiator or receiver. You can download all receipts as a PDF from your settings.',
    },
    {
      q: 'Can I export or download my business data?',
      a: 'Yes. In Settings > Data, you can download all receipts as a single PDF. For comprehensive data exports (including contacts, session history), contact our support team at support@nexusb2b.io.',
    },
    {
      q: 'How do I delete my account permanently?',
      a: 'Go to Settings > Account, scroll to "Danger Zone," and click "Delete Account Fully." This action is irreversible and will remove all your business data, receipts, and session history within 30 days.',
    },
    {
      q: 'Who can I invite to sessions on my behalf?',
      a: 'Only verified agents of your business (added in Settings > Business). Agents have read-only access to receipts and cannot modify your business profile. Session invites are always sent under your verified business identity.',
    },
    {
      q: 'Is there a maximum number of sessions I can open?',
      a: 'No. However, concurrent sessions may be rate-limited based on your subscription tier (demo tier: 5 concurrent sessions). Contact partnerships@nexusb2b.io for enterprise limits.',
    },
  ]

  return (
    <MarketingShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <header style={{ padding: '72px 0 48px', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 24 }}>/ Support</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px,8vw,108px)', lineHeight: 0.88, color: 'var(--nx-fg-strong)', marginBottom: 28, textTransform: 'uppercase' }}>
            Help & <span style={{ color: '#c44b1b' }}>Support</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.7, color: 'var(--nx-muted)', maxWidth: 720 }}>
            Find answers to common questions about verification, sessions, receipts, and account management. Can&apos;t find what you need? Reach out to support@nexusb2b.io.
          </p>
        </header>

        <div style={{ padding: '48px 0 80px', animation: 'nx-rise 0.4s ease' }}>
          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 56, border: '1px solid var(--nx-border)' }} className="nx-support-links">
            {[
              { icon: '?', label: 'Documentation', desc: 'Guides and API reference' },
              { icon: '⚙', label: 'Account Settings', desc: 'Manage your profile' },
              { icon: '📧', label: 'Contact Support', desc: 'Email our team' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.label === 'Documentation' ? '/help' : item.label === 'Contact Support' ? '/contact' : '/settings/account'}
                style={{
                  padding: '24px',
                  textDecoration: 'none',
                  borderRight: item.label === 'Contact Support' ? 'none' : '1px solid var(--nx-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--nx-raised)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ fontSize: 24 }}>{item.icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)' }}>{item.desc}</div>
              </a>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: 800 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--nx-fg-strong)', marginBottom: 32, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              Frequently Asked
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {faqs.map((faq, i) => (
                <div key={i} style={{ borderBottom: '1px solid var(--nx-border)' }}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    style={{
                      width: '100%',
                      padding: '18px 0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)', fontWeight: openFaq === i ? 600 : 400 }}>{faq.q}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: '#c44b1b', minWidth: 20, textAlign: 'center' }}>
                      {openFaq === i ? '−' : '+'}
                    </span>
                  </button>
                  {openFaq === i && (
                    <div style={{ paddingBottom: 18, animation: 'nx-rise 0.2s ease' }}>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.7, color: 'var(--nx-muted)' }}>{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div
            style={{
              marginTop: 64,
              padding: '32px 28px',
              border: '1px solid var(--nx-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'var(--nx-raised)',
            }}
            className="nx-support-cta"
          >
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Still need help?</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-fg-strong)' }}>Reach out to our team</div>
            </div>
            <a
              href="/contact"
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
              }}
            >
              Get in touch →
            </a>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px) {
          .nx-support-links { grid-template-columns: 1fr !important; }
          .nx-support-cta { flex-direction: column !important; gap: 16px; align-items: flex-start !important; }
        }
      `}</style>
    </MarketingShell>
  )
}
