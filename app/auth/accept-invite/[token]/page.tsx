'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
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

const inputStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
  color: 'var(--nx-fg)',
  background: 'var(--nx-bg)',
  border: '1px solid var(--nx-border)',
  padding: '12px 14px',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box' as const,
}

export default function AcceptInvitePage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 12) { setError('Password must be at least 12 characters'); return }

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/auth/accept-invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, name, password }),
    })

    const json = await res.json()
    setSubmitting(false)

    if (!res.ok) {
      setError(json.error ?? 'Invitation expired or already used.')
      return
    }

    router.push('/auth/login?invited=success')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <NxMark />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
            NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
          </span>
        </Link>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Team invitation</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 10 }}>JOIN YOUR TEAM</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 28 }}>
          Set up your account to join your team on NexusB2B.
        </p>

        {error && (
          <div style={{ border: '1px solid rgba(196,75,27,0.35)', background: 'rgba(196,75,27,0.06)', padding: '12px 16px', marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c44b1b', letterSpacing: '0.04em' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Full name</span>
            <input
              placeholder="Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Password</span>
            <input
              type="password"
              placeholder="Min 12 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Confirm password</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              style={inputStyle}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '14px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, marginTop: 4 }}
          >
            {submitting ? 'Setting up…' : 'Join team →'}
          </button>
        </form>
      </div>
    </div>
  )
}
