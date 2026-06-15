import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { decrypt } from '@/lib/crypto/encrypt'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, FileText } from 'lucide-react'

interface Props { params: { id: string } }

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

export default async function ReceiptPage({ params }: Props) {
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
    [params.id]
  )

  if (!receipt) notFound()

  const uid = session.user.businessId
  if (receipt.issuer_id !== uid && receipt.receiver_id !== uid) {
    redirect('/receipts')
  }

  const isReceiver = receipt.receiver_id === uid
  const items = JSON.parse(receipt.items)

  const bankDetails = isReceiver && receipt.bank_account_number
    ? {
        name: receipt.bank_account_name ? decrypt(receipt.bank_account_name) : null,
        number: decrypt(receipt.bank_account_number!),
        bank: receipt.bank_name ? decrypt(receipt.bank_name) : null,
        swift: receipt.bank_swift ? decrypt(receipt.bank_swift) : null,
      }
    : null

  return (
    <div className="container-app py-8 max-w-3xl space-y-6">
      <Link href="/receipts" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Receipts
      </Link>

      <div className="card-base space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap border-b border-border pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-brand-brown/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-brand-brown" />
            </div>
            <div>
              <p className="font-mono text-xs text-muted-foreground">RECEIPT #{receipt.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">{formatDate(receipt.created_at)}</p>
            </div>
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full ${
            receipt.status === 'acknowledged' ? 'bg-green-100 text-green-700' :
            receipt.status === 'sent' ? 'bg-brand-brown/10 text-brand-brown' :
            'bg-secondary text-muted-foreground'
          }`}>{receipt.status}</span>
        </div>

        {/* Parties */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">From</p>
            <p className="font-semibold text-foreground">{receipt.issuer_name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">To</p>
            <p className="font-semibold text-foreground">{receipt.receiver_name}</p>
          </div>
        </div>

        {/* Line items */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Items</p>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Description</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Qty</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Unit Price</th>
                  <th className="text-right px-4 py-2.5 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item: { description: string; qty: number; unitPrice: number; total: number }, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-foreground">{item.description}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono">{item.qty}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground font-mono">
                      {formatCurrency(item.unitPrice, receipt.currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold">
                      {formatCurrency(item.total, receipt.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-full sm:w-72 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-mono">{formatCurrency(Number(receipt.subtotal), receipt.currency)}</span>
            </div>
            {Number(receipt.tax_rate) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax ({(Number(receipt.tax_rate) * 100).toFixed(0)}%)</span>
                <span className="font-mono">{formatCurrency(Number(receipt.subtotal) * Number(receipt.tax_rate), receipt.currency)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold border-t border-border pt-2">
              <span>Total</span>
              <span className="font-mono">{formatCurrency(Number(receipt.total), receipt.currency)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {receipt.notes && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
            <p className="text-sm text-muted-foreground">{receipt.notes}</p>
          </div>
        )}

        {/* Bank details (receiver only) */}
        {bankDetails && (
          <div className="bg-secondary border border-border rounded-lg p-4 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Payment Details</p>
            {bankDetails.name && <p className="text-sm"><span className="text-muted-foreground">Account holder:</span> {bankDetails.name}</p>}
            <p className="text-sm font-mono"><span className="text-muted-foreground">Account / IBAN:</span> {bankDetails.number}</p>
            {bankDetails.bank && <p className="text-sm"><span className="text-muted-foreground">Bank:</span> {bankDetails.bank}</p>}
            {bankDetails.swift && <p className="text-sm font-mono"><span className="text-muted-foreground">SWIFT / BIC:</span> {bankDetails.swift}</p>}
          </div>
        )}

        {/* Acknowledge button */}
        {isReceiver && receipt.status === 'sent' && (
          <form action={`/api/receipts/${params.id}/acknowledge`} method="POST">
            <Button type="submit" className="w-full sm:w-auto">Acknowledge Receipt</Button>
          </form>
        )}
      </div>
    </div>
  )
}
