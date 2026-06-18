'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

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

type PageState = 'loading' | 'success' | 'wrong_business' | 'error'

export default function AcceptSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const token = params.token as string

  const [state, setState] = useState<PageState>('loading')
  const [error, setError] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    async function accept() {
      const res = await fetch(`/api/sessions/accept/${token}`, {
        method: 'POST',
        headers: session ? {} : {},
      })
      const json = await res.json()

      if (res.ok) {
        setSessionId(json.sessionId)
        setState('success')
        setTimeout(() => router.push(`/sessions/${json.sessionId}`), 2000)
      } else if (res.status === 403 && json.error?.includes('different business')) {
        setState('wrong_business')
      } else {
        setError(json.error ?? 'Failed to accept session.')
        setState('error')
      }
    }

    accept()
  }, [token, status, router, session])

  const card: React.CSSProperties = {
    width: '100%', maxWidth: 480,
    border: '1px solid var(--nx-border)',
    background: 'var(--nx-panel)',
    padding: 40,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 16, textAlign: 'center',
  }

  const btn = (accent = false): React.CSSProperties => ({
    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
    padding: '12px 24px', border: accent ? 'none' : '1px solid var(--nx-border)',
    background: accent ? '#c44b1b' : 'none',
    color: accent ? '#fff' : 'var(--nx-fg)',
    cursor: 'pointer', textDecoration: 'none', display: 'inline-block', width: '100%',
  })

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--nx-bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px',
    }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40 }}>
        <NxMark />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
          NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
        </span>
      </Link>

      <div style={card}>

        {/* Loading */}
        {state === 'loading' && (
          <>
            <div style={{ width: 52, height: 52, border: '2px solid var(--nx-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--nx-muted)', animation: 'spin 1s linear infinite' }}>◈</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Accepting session…</div>
          </>
        )}

        {/* Success */}
        {state === 'success' && (
          <>
            <div style={{ width: 52, height: 52, border: '2px solid #5a9a7a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#5a9a7a' }}>✓</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#5a9a7a' }}>Session accepted</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 0.95, color: 'var(--nx-fg-strong)' }}>YOU&apos;RE CONNECTED</h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.65 }}>
              Redirecting you to the deal session…
            </p>
            <Link href={`/sessions/${sessionId}`} style={btn(true)}>Open Session →</Link>
          </>
        )}

        {/* Wrong business — logged in as initiator */}
        {state === 'wrong_business' && (
          <>
            <div style={{ width: 52, height: 52, border: '2px solid rgba(196,75,27,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#c44b1b' }}>!</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b' }}>Wrong account</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 0.95, color: 'var(--nx-fg-strong)' }}>DIFFERENT BUSINESS</h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.65 }}>
              This invitation was sent to a different business. You&apos;re currently signed in as{' '}
              <strong style={{ color: 'var(--nx-fg-strong)' }}>{session?.user?.name}</strong>.
              Please sign out and sign in with the account that received this invitation, then use the link again.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', marginTop: 8 }}>
              <button
                onClick={() => signOut({ callbackUrl: `/sessions/accept/${token}` })}
                style={btn(true)}
              >
                Sign out &amp; switch account →
              </button>
              <Link href="/sessions" style={btn(false)}>Back to my sessions</Link>
            </div>
          </>
        )}

        {/* Generic error */}
        {state === 'error' && (
          <>
            <div style={{ width: 52, height: 52, border: '2px solid rgba(196,75,27,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--nx-muted)' }}>✕</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b' }}>Could not accept</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 0.95, color: 'var(--nx-fg-strong)' }}>INVITE INVALID</h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.65 }}>
              {error}
            </p>
            <Link href="/sessions" style={btn(false)}>Back to my sessions</Link>
          </>
        )}

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
