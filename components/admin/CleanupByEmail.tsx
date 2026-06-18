'use client'

import { useState } from 'react'

export function CleanupByEmail() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleCleanup() {
    if (!email.trim()) return
    setStatus('loading')
    setMessage('')
    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = await res.json()
      if (res.ok) {
        setStatus('success')
        setMessage(json.message)
        setEmail('')
        // Refresh the page after a moment so the business list updates
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setStatus('error')
        setMessage(json.error ?? 'Cleanup failed.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error.')
    }
  }

  return (
    <div style={{
      border: '1px solid var(--nx-border)',
      background: 'var(--nx-raised)',
      padding: '20px 24px',
      marginBottom: 28,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b' }}>
          ⚠ Account cleanup
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)' }}>
          Enter an email to delete that account and all its business data permanently.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setStatus('idle'); setMessage('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCleanup() }}
          placeholder="user@example.com"
          disabled={status === 'loading'}
          style={{
            flex: 1, minWidth: 260,
            background: 'var(--nx-panel)', border: '1px solid var(--nx-border)',
            padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--nx-fg-strong)', outline: 'none',
          }}
        />
        <button
          onClick={handleCleanup}
          disabled={!email.trim() || status === 'loading'}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            padding: '10px 20px', border: 'none', background: '#c44b1b', color: '#fff',
            cursor: (!email.trim() || status === 'loading') ? 'not-allowed' : 'pointer',
            opacity: (!email.trim() || status === 'loading') ? 0.55 : 1,
            whiteSpace: 'nowrap',
          }}
        >
          {status === 'loading' ? 'Deleting…' : '✕ Delete account'}
        </button>
      </div>

      {message && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.04em',
          color: status === 'success' ? '#5a9a7a' : '#c44b1b',
          padding: '8px 12px',
          border: `1px solid ${status === 'success' ? 'rgba(90,154,122,0.4)' : 'rgba(196,75,27,0.4)'}`,
          background: status === 'success' ? 'rgba(90,154,122,0.06)' : 'rgba(196,75,27,0.06)',
        }}>
          {status === 'success' ? '✓ ' : '✕ '}{message}
        </div>
      )}
    </div>
  )
}
