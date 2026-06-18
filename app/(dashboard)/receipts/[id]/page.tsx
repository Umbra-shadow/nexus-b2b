import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { decrypt } from '@/lib/crypto/encrypt'
import Link from 'next/link'

interface Props { params: Promise<{ id: string }> }

interface ReceiptRow {
  id: string
  session_id: string
  items: string
  subtotal: string
  tax_rate: string
  total: string
  currency: string
  notes: string | null
  status: string
  created_at: string
  issuer_id: string
  issuer_name: string
  receiver_id: string
  receiver_name: string
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_swift: string | null
}

const STATUS_STYLE: Record<string, { text: string; border: string; label: string }> = {
  draft:        { text: 'var(--nx-muted)', border: 'var(--nx-border)',         label: 'Draft' },
  sent:         { text: '#c44b1b',         border: 'rgba(196,75,27,0.5)',      label: 'Sent — awaiting delivery confirmation' },
  processed:    { text: '#6b7fcf',         border: 'rgba(107,127,207,0.5)',    label: 'Processed — awaiting sign-off' },
  acknowledged: { text: '#5a9a7a',         border: 'rgba(90,154,122,0.5)',     label: 'Completed' },
  completed:    { text: '#5a9a7a',         border: 'rgba(90,154,122,0.5)',     label: 'Completed' },
}

export default async function ReceiptPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const receipt = await queryOne<ReceiptRow>(
    `SELECT r.*,
            ib.id as issuer_id, ib.name as issuer_name,
            rb.id as receiver_id, rb.name as receiver_name,
            ib.bank_account_name, ib.bank_account_number, ib.bank_name, ib.bank_swift
     FROM receipts r
     JOIN businesses ib ON ib.id = r.issuer_business_id
     JOIN businesses rb ON rb.id = r.receiver_business_id
     WHERE r.id = $1`,
    [id]
  )

  if (!receipt) notFound()

  const uid = session.user.businessId
  if (receipt.issuer_id !== uid && receipt.receiver_id !== uid) {
    redirect('/receipts')
  }

  const isReceiver = receipt.receiver_id === uid
  const items: { description: string; qty: number; unitPrice: number; total: number }[] =
    typeof receipt.items === 'string' ? JSON.parse(receipt.items) : receipt.items
  const sc = STATUS_STYLE[receipt.status] ?? STATUS_STYLE.draft

  const bankDetails = isReceiver && receipt.bank_account_number
    ? {
        name: receipt.bank_account_name ? decrypt(receipt.bank_account_name) : null,
        number: decrypt(receipt.bank_account_number!),
        bank: receipt.bank_name ? decrypt(receipt.bank_name) : null,
        swift: receipt.bank_swift ? decrypt(receipt.bank_swift) : null,
      }
    : null

  return (
    <div style={{ padding: '28px 20px', maxWidth: 800, animation: 'nx-rise 0.4s ease' }}>
      {/* Back */}
      <Link href="/receipts" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', textDecoration: 'none', marginBottom: 28 }}>
        ← Back to Receipts
      </Link>

      <div style={{ border: '1px solid var(--nx-border)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 28px', borderBottom: '1px solid var(--nx-border)', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Receipt #{receipt.id.slice(0, 8).toUpperCase()}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 6 }}>
              {formatCurrency(Number(receipt.total), receipt.currency)}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>{formatDate(receipt.created_at)}</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: sc.text, border: `1px solid ${sc.border}`, padding: '6px 14px', whiteSpace: 'nowrap' }}>
            {sc.label}
          </span>
        </div>

        {/* From / To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ padding: '20px 28px', borderRight: '1px solid var(--nx-border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>From</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-fg-strong)' }}>{receipt.issuer_name}</div>
          </div>
          <div style={{ padding: '20px 28px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>To</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-fg-strong)' }}>{receipt.receiver_name}</div>
          </div>
        </div>

        {/* Line items */}
        <div style={{ borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ padding: '14px 28px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 1fr 1fr' }}>
              {['Description', 'Unit', 'Qty', 'Unit price', 'Total'].map((h) => (
                <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', textAlign: h === 'Description' || h === 'Unit' ? 'left' : 'right' }}>{h}</div>
              ))}
            </div>
          </div>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 100px 80px 1fr 1fr', padding: '12px 28px', borderBottom: '1px solid var(--nx-line)', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)' }}>{item.description}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>{(item as { unit?: string }).unit ?? 'Units'}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-muted)', textAlign: 'right' }}>{item.qty}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-muted)', textAlign: 'right' }}>{formatCurrency(item.unitPrice, receipt.currency)}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)', fontWeight: 600, textAlign: 'right' }}>{formatCurrency(item.total, receipt.currency)}</div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: '20px 28px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)' }}>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)' }}>{formatCurrency(Number(receipt.subtotal), receipt.currency)}</span>
            </div>
            {Number(receipt.tax_rate) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)' }}>Tax ({(Number(receipt.tax_rate) * 100).toFixed(0)}%)</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)' }}>{formatCurrency(Number(receipt.subtotal) * Number(receipt.tax_rate), receipt.currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--nx-border)', paddingTop: 10 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Total</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--nx-fg-strong)', fontWeight: 700 }}>{formatCurrency(Number(receipt.total), receipt.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--nx-border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>Notes</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', lineHeight: 1.6 }}>{receipt.notes}</p>
          </div>
        )}

        {/* Bank details */}
        {bankDetails && (
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 12 }}>Payment Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {bankDetails.name && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginBottom: 4, letterSpacing: '0.1em' }}>Account holder</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)' }}>{bankDetails.name}</div>
                </div>
              )}
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginBottom: 4, letterSpacing: '0.1em' }}>Account / IBAN</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>{bankDetails.number}</div>
              </div>
              {bankDetails.bank && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginBottom: 4, letterSpacing: '0.1em' }}>Bank</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)' }}>{bankDetails.bank}</div>
                </div>
              )}
              {bankDetails.swift && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginBottom: 4, letterSpacing: '0.1em' }}>SWIFT / BIC</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>{bankDetails.swift}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Link
              href={`/sessions/${receipt.session_id}`}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-fg)', border: '1px solid var(--nx-border)', padding: '12px 20px', textDecoration: 'none' }}
            >
              ← Session
            </Link>

            {/* ISSUER: mark as processed ("I've delivered my side") */}
            {!isReceiver && receipt.status === 'sent' && (
              <form action={`/api/receipts/${id}/process`} method="POST">
                <button
                  type="submit"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', background: '#6b7fcf', border: 'none', padding: '12px 20px', cursor: 'pointer' }}
                >
                  ✓ Mark as delivered
                </button>
              </form>
            )}

            {/* ISSUER: resend while still in sent state */}
            {!isReceiver && receipt.status === 'sent' && (
              <form action={`/api/receipts/${id}/resend`} method="POST">
                <button
                  type="submit"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-fg)', background: 'none', border: '1px solid var(--nx-border)', padding: '12px 20px', cursor: 'pointer' }}
                >
                  ↺ Resend
                </button>
              </form>
            )}

            {/* ISSUER: processed — waiting for receiver */}
            {!isReceiver && receipt.status === 'processed' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7fcf', border: '1px solid rgba(107,127,207,0.4)', padding: '12px 16px' }}>
                ✓ Delivered — awaiting receiver sign-off
              </span>
            )}

            {/* RECEIVER: mark as completed ("I confirm all is done") — requires processed first */}
            {isReceiver && receipt.status === 'processed' && (
              <form action={`/api/receipts/${id}/acknowledge`} method="POST">
                <button
                  type="submit"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', background: '#5a9a7a', border: 'none', padding: '12px 20px', cursor: 'pointer' }}
                >
                  ✓ Mark as completed
                </button>
              </form>
            )}

            {/* RECEIVER: legacy — allow acknowledging from 'sent' for old receipts */}
            {isReceiver && receipt.status === 'sent' && (
              <form action={`/api/receipts/${id}/acknowledge`} method="POST">
                <button
                  type="submit"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#fff', background: '#5a9a7a', border: 'none', padding: '12px 20px', cursor: 'pointer' }}
                >
                  ✓ Mark as completed
                </button>
              </form>
            )}

            {/* RECEIVER: still waiting for issuer to deliver */}
            {isReceiver && receipt.status === 'sent' && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>
                Waiting for issuer to confirm delivery
              </span>
            )}

            {(receipt.status === 'completed' || receipt.status === 'acknowledged') && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5a9a7a', border: '1px solid rgba(90,154,122,0.4)', padding: '12px 16px' }}>
                ✓ Completed
              </span>
            )}
          </div>

          {/* Download — real PDF generated server-side */}
          <a
            href={`/api/receipts/${id}/pdf`}
            download
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid rgba(196,75,27,0.4)', padding: '12px 20px', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            ⬇ Download PDF
          </a>
        </div>
      </div>
    </div>
  )
}
