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
            Everything you see here is fictional and built for a hackathon submission. No real money, real businesses, or real transactions are involved.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '28px 40px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 10 }}>What you are seeing</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.65, color: 'var(--nx-fg)' }}>
              All businesses in the discovery feed are <strong style={{ color: 'var(--nx-fg-strong)' }}>seeded with fictional data</strong>. When you open a session with one, an AI answers on their behalf — simulating how the platform would feel with real companies using it.
            </p>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 10 }}>How Lummy works</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.65, color: 'var(--nx-fg)' }}>
              <strong style={{ color: 'var(--nx-fg-strong)' }}>Lummy</strong> is the AI mediator inside NexusB2B. When you start a session, Lummy introduces both parties and then steps aside — letting the businesses negotiate directly. In this demo, Lummy also plays the role of the counterpart.
            </p>
          </div>

          <div style={{ border: '1px solid var(--nx-border)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 4 }}>Demo credentials</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 4 }}>Email</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>admin@meridian.io</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 4 }}>Password</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>demo1234</div>
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
