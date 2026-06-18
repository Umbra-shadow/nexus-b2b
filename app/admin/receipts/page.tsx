import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { formatDate, formatCurrency } from '@/lib/utils'

export const metadata = { title: 'Receipt Ledger — System Admin' }

interface ReceiptRow {
  id: string
  status: string
  total: string
  currency: string
  created_at: string
  issuer_name: string
  receiver_name: string
}

interface VolumeSummary {
  currency: string
  count: string
  volume: string
}

const STATUS_COLOR: Record<string, string> = {
  sent: '#c44b1b',
  acknowledged: '#5a9a7a',
  draft: 'var(--nx-muted)',
}

const STATUS_BORDER: Record<string, string> = {
  sent: 'rgba(196,75,27,0.35)',
  acknowledged: 'rgba(90,154,122,0.35)',
  draft: 'var(--nx-border)',
}

export default async function ReceiptsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const [receipts, volumeSummary] = await Promise.all([
    query<ReceiptRow>(`
      SELECT r.id, r.status, r.total::text, r.currency, r.created_at,
             ib.name as issuer_name, rb.name as receiver_name
      FROM receipts r
      JOIN businesses ib ON ib.id = r.issuer_business_id
      JOIN businesses rb ON rb.id = r.receiver_business_id
      ORDER BY r.created_at DESC
      LIMIT 100
    `),
    query<VolumeSummary>(`
      SELECT currency, COUNT(*)::text as count, SUM(total)::text as volume
      FROM receipts GROUP BY currency ORDER BY SUM(total) DESC
    `),
  ])

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          color: '#c44b1b',
          marginBottom: 10,
        }}>
          / Receipts
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 52,
          lineHeight: 0.9,
          color: 'var(--nx-fg-strong)',
          marginBottom: 24,
        }}>
          RECEIPT LEDGER
        </h1>

        {/* Volume summary */}
        {volumeSummary.length > 0 && (
          <div style={{ display: 'flex', gap: 0, border: '1px solid var(--nx-border)', marginBottom: 32, width: 'fit-content', background: 'var(--nx-border)' }}>
            {volumeSummary.map((v) => (
              <div key={v.currency} style={{ padding: '18px 28px', background: 'var(--nx-panel)' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--nx-muted)',
                  marginBottom: 8,
                }}>
                  {v.currency} · {v.count} receipts
                </div>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 36,
                  lineHeight: 0.9,
                  color: 'var(--nx-fg-strong)',
                }}>
                  {formatCurrency(parseFloat(v.volume ?? '0'), v.currency)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 12,
                  color: 'var(--nx-muted)',
                  marginTop: 6,
                }}>
                  total volume
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 2fr 80px 100px 120px 120px 80px',
        gap: 0,
        padding: '10px 20px',
        border: '1px solid var(--nx-border)',
        borderBottom: 'none',
        background: 'var(--nx-raised)',
      }}>
        {['Issuer', 'Receiver', 'Status', 'Currency', 'Total', 'Date', ''].map((h) => (
          <div key={h} style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--nx-muted)',
          }}>
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ border: '1px solid var(--nx-border)' }}>
        {receipts.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
            No receipts yet.
          </div>
        ) : (
          receipts.map((r, i) => (
            <div
              key={r.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 80px 100px 120px 120px 80px',
                alignItems: 'center',
                gap: 0,
                padding: '12px 20px',
                borderBottom: i < receipts.length - 1 ? '1px solid var(--nx-border)' : undefined,
              }}
            >
              {/* Issuer */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {r.issuer_name}
              </div>

              {/* Receiver */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {r.receiver_name}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 9px',
                  border: `1px solid ${STATUS_BORDER[r.status] ?? 'var(--nx-border)'}`,
                  color: STATUS_COLOR[r.status] ?? 'var(--nx-muted)',
                }}>
                  {r.status}
                </span>
              </div>

              {/* Currency */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {r.currency}
              </div>

              {/* Total */}
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--nx-fg-strong)' }}>
                {formatCurrency(parseFloat(r.total ?? '0'), r.currency)}
              </div>

              {/* Date */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>
                {formatDate(r.created_at)}
              </div>

              {/* Download */}
              <div>
                <Link
                  href={`/admin/receipts/${r.id}/print`}
                  target="_blank"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none' }}
                >
                  ↓ PDF
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {receipts.length === 100 && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.08em', textAlign: 'center' }}>
          Showing most recent 100 receipts
        </div>
      )}
    </div>
  )
}
