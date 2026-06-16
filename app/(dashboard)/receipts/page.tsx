import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'

export const metadata = { title: 'Receipts' }

interface ReceiptRow {
  id: string
  total: string
  currency: string
  status: string
  created_at: string
  issuer_name: string
  receiver_name: string
  issuer_business_id: string
}

const STATUS_COLOR: Record<string, { text: string; border: string }> = {
  draft: { text: 'var(--nx-muted)', border: 'var(--nx-border)' },
  sent: { text: '#c44b1b', border: '#7a2a0c' },
  acknowledged: { text: '#5a9a7a', border: '#2a5a3a' },
}

export default async function ReceiptsPage() {
  const session = await auth()
  const user = session!.user

  const receipts = await query<ReceiptRow>(
    `SELECT r.id, r.total, r.currency, r.status, r.created_at, r.issuer_business_id,
            ib.name as issuer_name, rb.name as receiver_name
     FROM receipts r
     JOIN businesses ib ON ib.id = r.issuer_business_id
     JOIN businesses rb ON rb.id = r.receiver_business_id
     WHERE r.issuer_business_id = $1 OR r.receiver_business_id = $1
     ORDER BY r.created_at DESC`,
    [user.businessId]
  )

  return (
    <div style={{ padding: '28px 20px', animation: 'nx-rise 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Receipts</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>RECEIPTS</h1>
      </div>

      {receipts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--nx-strong)', marginBottom: 16 }}>▤</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-muted)' }}>No receipts yet. Create one inside a deal session.</p>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--nx-border)' }}>
          {/* Table header */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
            {['Ref', 'Counterparty', 'Amount', 'Status', ''].map((h) => (
              <div key={h} style={{ padding: '10px 20px', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>{h}</div>
            ))}
          </div>
          {/* Rows */}
          {receipts.map((r) => {
            const isIssuer = r.issuer_business_id === user.businessId
            const sc = STATUS_COLOR[r.status] ?? STATUS_COLOR.draft
            return (
              <Link
                key={r.id}
                href={`/receipts/${r.id}`}
                style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr auto', borderBottom: '1px solid var(--nx-line)', textDecoration: 'none', alignItems: 'center' }}
              >
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>{formatDate(r.created_at)}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', letterSpacing: '0.04em' }}>#{r.id.slice(0, 8)}</div>
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', marginBottom: 2 }}>
                    {isIssuer ? r.receiver_name : r.issuer_name}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>
                    {isIssuer ? '↑ Issued' : '↓ Received'}
                  </div>
                </div>
                <div style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--nx-fg-strong)', fontWeight: 600 }}>
                  {formatCurrency(Number(r.total), r.currency)}
                </div>
                <div style={{ padding: '14px 20px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: sc.text, border: `1px solid ${sc.border}`, padding: '3px 8px' }}>
                    {r.status}
                  </span>
                </div>
                <div style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-subtle)' }}>→</div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
