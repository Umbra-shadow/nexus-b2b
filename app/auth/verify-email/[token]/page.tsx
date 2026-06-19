'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

function NxMark() {
  return (
    <div style={{ width: 26, height: 26, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', top: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', top: 0, right: 0 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', bottom: 0, right: 0 }} />
    </div>
  )
}

type State = 'loading' | 'success' | 'expired' | 'resent'

export default function VerifyEmailPage() {
  const params = useParams<{ token: string }>()
  const token = params.token

  const [state, setState] = useState<State>('loading')
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    fetch(`/api/auth/verify-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((j) => setState(j.ok ? 'success' : 'expired'))
      .catch(() => setState('expired'))
  }, [token])

  async function resend(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    await fetch('/api/auth/request-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
    setSending(false)
    setState('resent')
  }

  const wrap = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <NxMark />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
            NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )

  if (state === 'loading') return wrap(
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.14em' }}>Verifying…</div>
  )

  if (state === 'success') return wrap(
    <>
      <div style={{ width: 52, height: 52, border: '2px solid #5a9a7a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#5a9a7a' }}>✓</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#5a9a7a', marginBottom: 10 }}>/ Email verified</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 16 }}>YOU&apos;RE VERIFIED</h1>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 32 }}>
        Your email has been verified. Your business registration is now under review — we&apos;ll notify you once approved. You can sign in now.
      </p>
      <Link href="/auth/login" style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 28px', textDecoration: 'none' }}>
        Sign in →
      </Link>
    </>
  )

  if (state === 'resent') return wrap(
    <>
      <div style={{ width: 52, height: 52, border: '2px solid #5a9a7a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#5a9a7a' }}>✓</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#5a9a7a', marginBottom: 10 }}>/ Email sent</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 16 }}>CHECK YOUR INBOX</h1>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 32 }}>
        If that email is registered on NexusB2B and not yet verified, a fresh link is on its way. It is valid for 7 days.
      </p>
      <Link href="/auth/login" style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 28px', textDecoration: 'none' }}>
        ← Back to login
      </Link>
    </>
  )

  // expired state
  return wrap(
    <>
      <div style={{ width: 52, height: 52, border: '2px solid rgba(196,75,27,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--nx-muted)' }}>✕</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Verification failed</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 14 }}>LINK EXPIRED</h1>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 28 }}>
        This link has expired or already been used. Enter your email below to receive a fresh one instantly.
      </p>

      <form onSubmit={resend}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          style={{
            width: '100%',
            background: 'var(--nx-raised)',
            border: '1px solid var(--nx-border)',
            padding: '12px 14px',
            fontFamily: 'var(--font-mono)',
            fontSize: 13,
            color: 'var(--nx-fg-strong)',
            outline: 'none',
            marginBottom: 12,
            boxSizing: 'border-box',
          }}
        />
        <button
          type="submit"
          disabled={sending}
          style={{
            width: '100%',
            background: sending ? 'var(--nx-muted)' : '#c44b1b',
            color: '#fff',
            border: 'none',
            padding: '12px 0',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            cursor: sending ? 'not-allowed' : 'pointer',
            marginBottom: 16,
          }}
        >
          {sending ? 'Sending…' : 'Send new link →'}
        </button>
      </form>

      <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)', textDecoration: 'none' }}>
        ← Back to login
      </Link>
    </>
  )
}
