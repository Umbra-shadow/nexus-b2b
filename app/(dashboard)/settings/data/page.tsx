'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ReceiptRow {
  id: string
  status: string
  total: string | number
  currency: string
  created_at: string
  issuer_name: string
  receiver_name: string
}

const STATUS_LABEL: Record<string, string> = {
  sent: 'Sent',
  processed: 'Delivered',
  completed: 'Completed',
  acknowledged: 'Completed',
  draft: 'Draft',
}

const STATUS_COLOR: Record<string, string> = {
  completed: '#5a9a7a',
  acknowledged: '#5a9a7a',
  processed: '#6b7fcf',
  sent: '#c8a240',
  draft: 'var(--nx-muted)',
}

function fmt(amount: string | number, currency: string) {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount
  return isNaN(n) ? `${currency} —` : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

export default function DataSettingsPage() {
  const [receipts, setReceipts] = useState<ReceiptRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/receipts')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => setReceipts(j.receipts ?? []))
      .catch(() => setError('Failed to load receipts.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ maxWidth: 680 }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--nx-fg-strong)', marginBottom: 6, textTransform: 'uppercase' }}>Data &amp; Exports</h2>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', marginBottom: 32, lineHeight: 1.6 }}>
        Download PDF copies of your receipts. Each receipt is generated server-side as a signed A4 document.
      </p>

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--nx-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          <Loader2 size={16} className="animate-spin" /> Loading receipts…
        </div>
      )}

      {error && (
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#c44b1b' }}>{error}</p>
      )}

      {receipts && receipts.length === 0 && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)' }}>No receipts yet. Receipts appear here once a deal session issues one.</p>
      )}

      {receipts && receipts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--nx-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 90px 110px', padding: '10px 16px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
            {['Receipt', 'Parties', 'Amount', 'Status', ''].map((h) => (
              <span key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>{h}</span>
            ))}
          </div>

          {receipts.map((r) => {
            const date = new Date(r.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
            return (
              <div
                key={r.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 90px 110px', padding: '14px 16px', borderBottom: '1px solid var(--nx-line)', alignItems: 'center' }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-fg-strong)' }}>#{r.id.slice(0, 8).toUpperCase()}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', marginTop: 2 }}>{date}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 8 }}>
                  {r.issuer_name} → {r.receiver_name}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>
                  {fmt(r.total, r.currency)}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: STATUS_COLOR[r.status] ?? 'var(--nx-muted)' }}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </div>
                <a
                  href={`/api/receipts/${r.id}/pdf`}
                  download
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none', border: '1px solid rgba(196,75,27,0.4)', padding: '6px 10px', textAlign: 'center' }}
                >
                  ⬇ PDF
                </a>
              </div>
            )
          })}

          <div style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)' }}>
            {receipts.length} receipt{receipts.length !== 1 ? 's' : ''} total
          </div>
        </div>
      )}
    </div>
  )
}
