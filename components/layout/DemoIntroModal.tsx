'use client'

import { useState } from 'react'
import Link from 'next/link'

export function DemoIntroModal() {
  const [show, setShow] = useState(true)

  function dismiss() {
    setShow(false)
  }

  if (!show) return null

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: 660,
        maxWidth: '100%',
        background: 'var(--nx-panel)',
        border: '1px solid var(--nx-strong)',
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'nx-rise 0.35s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '32px 40px 0', borderBottom: '1px solid var(--nx-border)', paddingBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, background: '#c44b1b', borderRadius: 9999, display: 'inline-block', animation: 'nx-dot 1.6s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b' }}>Demonstration environment</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 12 }}>
            YOU&apos;RE IN A<br />DEMONSTRATION.
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.65, color: 'var(--nx-muted)', maxWidth: 500 }}>
            The platform and all its infrastructure is <strong style={{ color: 'var(--nx-fg)' }}>fully live</strong>. The businesses, users, and transactions are fictional — seeded for this hackathon submission.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 10 }}>The system is real — the data is not</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.65, color: 'var(--nx-fg)' }}>
              The infrastructure is fully operational: <strong style={{ color: 'var(--nx-fg-strong)' }}>AWS Aurora PostgreSQL, DynamoDB, S3, and SES</strong> are all live and connected. The businesses, users, and transactions you see are <strong style={{ color: 'var(--nx-fg-strong)' }}>seeded with fictional data</strong> — they are not real entities.
            </p>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 10 }}>How Lummy works</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.65, color: 'var(--nx-fg)' }}>
              <strong style={{ color: 'var(--nx-fg-strong)' }}>Lummy</strong> is the AI mediator inside NexusB2B. When you start a session, Lummy introduces both parties and then steps aside — letting the businesses negotiate directly. In this demo, Lummy also plays the role of the counterpart.
            </p>
          </div>

          {/* Gemini key notice */}
          <div style={{ background: 'rgba(196,75,27,0.06)', border: '1px solid rgba(196,75,27,0.25)', padding: '14px 18px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 6 }}>⚠ Gemini API key required for AI features</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', lineHeight: 1.6 }}>
              AI-powered deal sessions require a <strong style={{ color: 'var(--nx-fg-strong)' }}>Google Gemini API key</strong>. Enter yours in the top bar after logging in. Without it, AI replies will not work.
            </div>
          </div>

          {/* Credentials */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c44b1b' }}>Demo credentials</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {/* Business admin */}
              <div style={{ border: '1px solid var(--nx-border)', padding: '14px 18px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 10 }}>Business Admin</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', marginBottom: 2 }}>EMAIL</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>admin@meridian.io</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', marginBottom: 2 }}>PASSWORD</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>demo1234</div>
                  </div>
                </div>
              </div>
              {/* System admin */}
              <div style={{ border: '1px solid rgba(196,75,27,0.3)', padding: '14px 18px', background: 'rgba(196,75,27,0.03)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>System Admin</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', marginBottom: 2 }}>EMAIL</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>admin@nexusb2b.io</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', marginBottom: 2 }}>PASSWORD</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>admin1234</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 40px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <Link
            href="/"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-subtle)', textDecoration: 'none' }}
          >
            ← Back to landing
          </Link>
          <button
            onClick={dismiss}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#ffffff',
              background: '#c44b1b',
              padding: '15px 28px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            I understand — continue →
          </button>
        </div>
      </div>
    </div>
  )
}
