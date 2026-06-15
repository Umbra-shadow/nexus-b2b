import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import Link from 'next/link'
import { FileText, ArrowRight } from 'lucide-react'
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
}

export default async function ReceiptsPage() {
  const session = await auth()
  const user = session!.user

  const receipts = await query<ReceiptRow>(
    `SELECT r.id, r.total, r.currency, r.status, r.created_at,
            ib.name as issuer_name, rb.name as receiver_name
     FROM receipts r
     JOIN businesses ib ON ib.id = r.issuer_business_id
     JOIN businesses rb ON rb.id = r.receiver_business_id
     WHERE r.issuer_business_id = $1 OR r.receiver_business_id = $1
     ORDER BY r.created_at DESC`,
    [user.businessId]
  )

  const STATUS_STYLE: Record<string, string> = {
    draft: 'text-muted-foreground',
    sent: 'text-brand-brown',
    acknowledged: 'text-green-600',
  }

  return (
    <div className="container-app py-8 space-y-6">
      <div>
        <h1 className="text-heading text-foreground">Receipts</h1>
        <p className="text-muted-foreground mt-1">Issued and received documents</p>
      </div>

      {receipts.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No receipts yet. Create one inside a deal session.</p>
        </div>
      ) : (
        <div className="card-base overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Date</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">From → To</th>
                  <th className="text-right px-6 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-6 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-foreground">{r.issuer_name}</span>
                      <span className="text-muted-foreground mx-2">→</span>
                      <span className="text-foreground">{r.receiver_name}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-semibold whitespace-nowrap">
                      {formatCurrency(Number(r.total), r.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium capitalize ${STATUS_STYLE[r.status] ?? ''}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/receipts/${r.id}`}
                        className="inline-flex items-center gap-1 text-brand-brown hover:underline text-xs"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
