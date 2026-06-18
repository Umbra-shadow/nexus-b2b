'use client'

import { useState } from 'react'

export function EmailDiagnostic() {
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; id?: string; from?: string; to?: string; error?: string } | null>(null)

  async function send() {
    if (!to.trim()) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim() }),
      })
      const json = await res.json()
      setResult(json)
    } catch {
      setResult({ error: 'Network error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ border: '1px solid var(--nx-border)', padding: '18px 20px', background: 'var(--nx-raised)', marginBottom: 24 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 12 }}>
        Email Delivery Test
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="email"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="recipient@example.com"
          onKeyDown={(e) => e.key === 'Enter' && send()}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '7px 12px', outline: 'none', width: 240 }}
        />
        <button
          onClick={send}
          disabled={loading || !to.trim()}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 16px', border: '1px solid var(--nx-border)', background: 'none', color: 'var(--nx-fg)', cursor: (loading || !to.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !to.trim()) ? 0.5 : 1, whiteSpace: 'nowrap' }}
        >
          {loading ? 'Sending…' : '✉ Send test email'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop: 10 }}>
          {result.success ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', letterSpacing: '0.04em' }}>
                ✓ Accepted by Resend — check inbox for {result.to}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>
                from: {result.from} · resend id: {result.id}
              </div>
            </div>
          ) : (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', letterSpacing: '0.04em' }}>
              ✕ {result.error}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
