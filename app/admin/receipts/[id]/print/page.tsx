import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'

interface ReceiptFull {
  id: string
  status: string
  total: string
  subtotal: string
  tax_rate: string
  currency: string
  notes: string | null
  created_at: string
  items: Array<{ description: string; qty: number; unitPrice: number }>
  issuer_name: string
  issuer_country: string
  receiver_name: string
  receiver_country: string
  session_id: string
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n)
}

export default async function ReceiptPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const { id } = await params

  const receipt = await queryOne<ReceiptFull>(`
    SELECT r.id, r.status, r.total::text, r.subtotal::text, r.tax_rate::text, r.currency, r.notes, r.created_at, r.items,
           ib.name as issuer_name, ib.country as issuer_country,
           rb.name as receiver_name, rb.country as receiver_country,
           r.session_id
    FROM receipts r
    JOIN businesses ib ON ib.id = r.issuer_business_id
    JOIN businesses rb ON rb.id = r.receiver_business_id
    WHERE r.id = $1
  `, [id])

  if (!receipt) redirect('/admin/receipts')

  const items = Array.isArray(receipt.items) ? receipt.items : []
  const subtotal = parseFloat(receipt.subtotal ?? '0')
  const taxRate = parseFloat(receipt.tax_rate ?? '0')
  const total = parseFloat(receipt.total ?? '0')
  const taxAmount = total - subtotal
  const date = new Date(receipt.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <html lang="en">
      <head>
        <title>{`Receipt ${receipt.id.slice(0, 8).toUpperCase()} — NexusB2B`}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Georgia, serif; background: #fff; color: #111; padding: 48px; max-width: 800px; margin: 0 auto; }
          @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
          }
          h1 { font-size: 42px; letter-spacing: 0.04em; text-transform: uppercase; line-height: 1; margin-bottom: 4px; }
          .mono { font-family: 'Courier New', monospace; }
          .label { font-size: 9px; letter-spacing: 0.18em; text-transform: uppercase; color: #666; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th { text-align: left; font-family: 'Courier New', monospace; font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; color: #666; padding: 8px 0; border-bottom: 1px solid #ddd; }
          td { padding: 10px 0; border-bottom: 1px solid #eee; font-size: 13px; }
          .right { text-align: right; }
          .total-row td { border-top: 2px solid #111; border-bottom: none; padding-top: 12px; font-size: 18px; font-weight: bold; }
          .print-btn { display: inline-block; margin-top: 32px; padding: 12px 24px; background: #c44b1b; color: #fff; border: none; cursor: pointer; font-family: 'Courier New', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; }
        `}</style>
      </head>
      <body>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 48 }}>
          <div>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
            </div>
            <div className="label">Verified Deal Platform</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="label" style={{ marginBottom: 4 }}>Receipt</div>
            <div style={{ fontFamily: 'Courier New, monospace', fontSize: 14, letterSpacing: '0.08em' }}>{receipt.id.slice(0, 8).toUpperCase()}</div>
            <div className="mono" style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{date}</div>
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 40, padding: '20px 0', borderTop: '1px solid #ddd', borderBottom: '1px solid #ddd' }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Issued by</div>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{receipt.issuer_name}</div>
            <div className="mono" style={{ fontSize: 11, color: '#666' }}>{receipt.issuer_country}</div>
          </div>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>Issued to</div>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{receipt.receiver_name}</div>
            <div className="mono" style={{ fontSize: 11, color: '#666' }}>{receipt.receiver_country}</div>
          </div>
        </div>

        {/* Line items */}
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th className="right">Qty</th>
              <th className="right">Unit Price</th>
              <th className="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td className="right mono">{item.qty}</td>
                <td className="right mono">{fmt(item.unitPrice, receipt.currency)}</td>
                <td className="right mono">{fmt(item.qty * item.unitPrice, receipt.currency)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={3} className="right label" style={{ paddingTop: 12 }}>Subtotal</td>
              <td className="right mono" style={{ paddingTop: 12 }}>{fmt(subtotal, receipt.currency)}</td>
            </tr>
            {taxRate > 0 && (
              <tr>
                <td colSpan={3} className="right label">Tax ({(taxRate * 100).toFixed(0)}%)</td>
                <td className="right mono">{fmt(taxAmount, receipt.currency)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td colSpan={3} className="right">Total</td>
              <td className="right">{fmt(total, receipt.currency)}</td>
            </tr>
          </tbody>
        </table>

        {/* Notes */}
        {receipt.notes && (
          <div style={{ marginTop: 32, padding: '16px 0', borderTop: '1px solid #ddd' }}>
            <div className="label" style={{ marginBottom: 8 }}>Notes</div>
            <p style={{ fontSize: 14, color: '#444', lineHeight: 1.6 }}>{receipt.notes}</p>
          </div>
        )}

        {/* Status + footer */}
        <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>Status</div>
            <div className="mono" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{receipt.status}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 9, color: '#999', letterSpacing: '0.1em' }}>Issued via NexusB2B · nexus-b2b.vercel.app</div>
            <div className="mono" style={{ fontSize: 9, color: '#999', marginTop: 2 }}>Session: {receipt.session_id.slice(0, 8).toUpperCase()}</div>
          </div>
        </div>

        {/* Print button */}
        <div className="no-print">
          <button id="print-btn" className="print-btn">⬇ Print / Download PDF</button>
        </div>
        <script dangerouslySetInnerHTML={{ __html: `document.getElementById('print-btn').onclick=function(){window.print()}` }} />
      </body>
    </html>
  )
}
