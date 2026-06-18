'use client'

import { useState } from 'react'

export function EmailVerificationBanner() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function resend() {
    setStatus('sending')
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/resend-verification', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to send.')
        setStatus('error')
      } else {
        setStatus('sent')
      }
    } catch {
      setErrorMsg('Network error. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div style={{
      background: 'rgba(196,75,27,0.08)',
      borderBottom: '1px solid rgba(196,75,27,0.25)',
      padding: '10px 28px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexShrink: 0,
      flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c44b1b', whiteSpace: 'nowrap' }}>
        ◈ Email not verified
      </span>
      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', lineHeight: 1.5, flex: 1 }}>
        {status === 'sent'
          ? 'Verification email sent — check your inbox (and spam folder).'
          : status === 'error'
          ? errorMsg
          : 'Check your inbox for a verification link. Some features may be limited until your email is confirmed.'}
      </span>
      {status !== 'sent' && (
        <button
          onClick={resend}
          disabled={status === 'sending'}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: '#c44b1b', background: 'none', border: '1px solid rgba(196,75,27,0.4)',
            padding: '5px 14px', cursor: status === 'sending' ? 'not-allowed' : 'pointer',
            opacity: status === 'sending' ? 0.6 : 1, whiteSpace: 'nowrap', flexShrink: 0,
          }}
        >
          {status === 'sending' ? 'Sending…' : '↺ Resend email'}
        </button>
      )}
    </div>
  )
}
