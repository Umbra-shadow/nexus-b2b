import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { notFound, redirect } from 'next/navigation'
import { decrypt } from '@/lib/crypto/encrypt'

interface Props { params: Promise<{ id: string }> }

interface ReceiptRow {
  id: string
  session_id: string
  status: string
  items: Array<{ description: string; unit?: string; qty: number; unitPrice: number; total: number }>
  subtotal: string
  tax_rate: string
  total: string
  currency: string
  notes: string | null
  created_at: string
  issuer_id: string
  issuer_name: string
  issuer_country: string
  receiver_id: string
  receiver_name: string
  receiver_country: string
  bank_account_name: string | null
  bank_account_number: string | null
  bank_name: string | null
  bank_swift: string | null
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

const STATUS_LABEL: Record<string, string> = {
  sent: 'Sent — Pending delivery confirmation',
  processed: 'Processed — Awaiting receiver sign-off',
  completed: 'Completed',
  acknowledged: 'Completed',
  draft: 'Draft',
}

export default async function ReceiptPrintPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const receipt = await queryOne<ReceiptRow>(`
    SELECT r.id, r.session_id, r.status,
           r.items, r.subtotal::text, r.tax_rate::text, r.total::text,
           r.currency, r.notes, r.created_at,
           ib.id as issuer_id, ib.name as issuer_name, ib.country as issuer_country,
           rb.id as receiver_id, rb.name as receiver_name, rb.country as receiver_country,
           ib.bank_account_name, ib.bank_account_number, ib.bank_name, ib.bank_swift
    FROM receipts r
    JOIN businesses ib ON ib.id = r.issuer_business_id
    JOIN businesses rb ON rb.id = r.receiver_business_id
    WHERE r.id = $1
  `, [id])

  if (!receipt) notFound()

  const uid = session.user.businessId
  if (receipt.issuer_id !== uid && receipt.receiver_id !== uid) redirect('/receipts')

  const isReceiver = receipt.receiver_id === uid
  const items = Array.isArray(receipt.items) ? receipt.items : []
  const subtotal = parseFloat(receipt.subtotal)
  const taxRate = parseFloat(receipt.tax_rate ?? '0')
  const total = parseFloat(receipt.total)
  const taxAmount = total - subtotal
  const date = new Date(receipt.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  const bank = isReceiver && receipt.bank_account_number ? {
    name: receipt.bank_account_name ? decrypt(receipt.bank_account_name) : null,
    number: decrypt(receipt.bank_account_number!),
    bankName: receipt.bank_name ? decrypt(receipt.bank_name) : null,
    swift: receipt.bank_swift ? decrypt(receipt.bank_swift) : null,
  } : null

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <title>{`Receipt ${receipt.id.slice(0, 8).toUpperCase()} — NexusB2B`}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, 'Times New Roman', serif; background: #fff; color: #111; padding: 52px 56px; max-width: 820px; margin: 0 auto; font-size: 14px; }
          @page { size: A4; margin: 20mm; }
          @media print { body { padding: 0; } .no-print { display: none !important; } }
          .mono { font-family: 'Courier New', Courier, monospace; }
          .label { font-family: 'Courier New', monospace; font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase; color: #777; }
          table { width: 100%; border-collapse: collapse; }
          th { font-family: 'Courier New', monospace; font-size: 8px; letter-spacing: 0.18em; text-transform: uppercase; color: #777; padding: 8px 0; border-bottom: 1px solid #ccc; text-align: left; }
          th.right, td.right { text-align: right; }
          td { padding: 11px 0; border-bottom: 1px solid #eee; vertical-align: top; }
          .divider { border: none; border-top: 1px solid #ccc; margin: 28px 0; }
          .print-btn { display: inline-flex; align-items: center; gap: 8px; margin-top: 36px; padding: 12px 24px; background: #c44b1b; color: #fff; border: none; cursor: pointer; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
          .back-link { font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #c44b1b; text-decoration: none; }
        `}</style>
      </head>
      <body>
        {/* Toolbar */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 36 }}>
          <a href={`/receipts/${id}`} className="back-link">← Back to receipt</a>
          <button className="print-btn" id="printBtn">⬇ Download / Print PDF</button>
        </div>

        {/* Letterhead */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 44 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, marginBottom: 6 }}>
              NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
            </div>
            <div className="label">Verified B2B Deal Platform</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ marginBottom: 5 }}>Receipt</div>
            <div className="mono" style={{ fontSize: 16, letterSpacing: '0.06em', color: '#111' }}>
              #{receipt.id.slice(0, 8).toUpperCase()}
            </div>
            <div className="mono" style={{ fontSize: 10, color: '#777', marginTop: 5 }}>{date}</div>
            <div style={{ marginTop: 8, padding: '3px 10px', border: '1px solid #ccc', display: 'inline-block' }}>
              <span className="label" style={{ color: '#555' }}>{STATUS_LABEL[receipt.status] ?? receipt.status}</span>
            </div>
          </div>
        </div>

        <hr className="divider" />

        {/* Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 36 }}>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Issued by</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{receipt.issuer_name}</div>
            <div className="mono" style={{ fontSize: 11, color: '#777' }}>{receipt.issuer_country}</div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Issued to</div>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{receipt.receiver_name}</div>
            <div className="mono" style={{ fontSize: 11, color: '#777' }}>{receipt.receiver_country}</div>
          </div>
        </div>

        <hr className="divider" />

        {/* Line items */}
        <table>
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Description</th>
              <th>Unit</th>
              <th className="right">Qty</th>
              <th className="right">Unit Price</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td style={{ paddingRight: 16 }}>{item.description}</td>
                <td className="mono" style={{ fontSize: 11, color: '#777' }}>{item.unit ?? 'Units'}</td>
                <td className="mono right" style={{ fontSize: 12 }}>{item.qty}</td>
                <td className="mono right" style={{ fontSize: 12 }}>{fmt(item.unitPrice, receipt.currency)}</td>
                <td className="mono right" style={{ fontSize: 12, fontWeight: 600 }}>{fmt(item.qty * item.unitPrice, receipt.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
          <div style={{ width: 280 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eee' }}>
              <span className="label">Subtotal</span>
              <span className="mono" style={{ fontSize: 12 }}>{fmt(subtotal, receipt.currency)}</span>
            </div>
            {taxRate > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #eee' }}>
                <span className="label">Tax ({(taxRate * 100).toFixed(0)}%)</span>
                <span className="mono" style={{ fontSize: 12 }}>{fmt(taxAmount, receipt.currency)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderTop: '2px solid #111', marginTop: 4 }}>
              <span style={{ fontFamily: 'Courier New, monospace', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>Total</span>
              <span className="mono" style={{ fontSize: 18, fontWeight: 700 }}>{fmt(total, receipt.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <>
            <hr className="divider" />
            <div>
              <div className="label" style={{ marginBottom: 10 }}>Notes</div>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.7 }}>{receipt.notes}</p>
            </div>
          </>
        )}

        {/* Bank / Payment details */}
        {bank && (
          <>
            <hr className="divider" />
            <div>
              <div className="label" style={{ marginBottom: 14 }}>Payment details</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {bank.name && (
                  <div>
                    <div className="label" style={{ marginBottom: 4 }}>Account holder</div>
                    <div style={{ fontSize: 14 }}>{bank.name}</div>
                  </div>
                )}
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Account / IBAN</div>
                  <div className="mono" style={{ fontSize: 13 }}>{bank.number}</div>
                </div>
                {bank.bankName && (
                  <div>
                    <div className="label" style={{ marginBottom: 4 }}>Bank</div>
                    <div style={{ fontSize: 14 }}>{bank.bankName}</div>
                  </div>
                )}
                {bank.swift && (
                  <div>
                    <div className="label" style={{ marginBottom: 4 }}>SWIFT / BIC</div>
                    <div className="mono" style={{ fontSize: 13 }}>{bank.swift}</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <hr className="divider" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="label" style={{ color: '#aaa' }}>
            Issued via NexusB2B · Session {receipt.session_id.slice(0, 8).toUpperCase()}
          </div>
          <div className="label" style={{ color: '#aaa', textAlign: 'right' }}>
            nexus-b2b.vercel.app
          </div>
        </div>

        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('printBtn').addEventListener('click',function(){window.print()})` }} />
      </body>
    </html>
  )
}
