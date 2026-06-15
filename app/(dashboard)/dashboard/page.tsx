import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import Link from 'next/link'
import { MessageSquare, Search, FileText, Users, ArrowRight } from 'lucide-react'
import { StatusPill } from '@/components/shared/StatusPill'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const session = await auth()
  const user = session!.user

  const [activeSessions, pendingInvites, recentReceipts, business] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sessions WHERE (initiator_agent_id = $1 OR receiver_agent_id = $1) AND status = 'active'`,
      [user.id]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sessions WHERE receiver_business_id = $1 AND status = 'pending'`,
      [user.businessId]
    ),
    query<{ id: string; total: number; currency: string; status: string; created_at: string; issuer_name: string; receiver_name: string }>(
      `SELECT r.id, r.total, r.currency, r.status, r.created_at,
              ib.name as issuer_name, rb.name as receiver_name
       FROM receipts r
       JOIN businesses ib ON ib.id = r.issuer_business_id
       JOIN businesses rb ON rb.id = r.receiver_business_id
       WHERE r.issuer_business_id = $1 OR r.receiver_business_id = $1
       ORDER BY r.created_at DESC LIMIT 5`,
      [user.businessId]
    ),
    queryOne<{ name: string; verification_status: string }>(
      `SELECT name, verification_status FROM businesses WHERE id = $1`,
      [user.businessId]
    ),
  ])

  const activeCount = parseInt(activeSessions[0]?.count ?? '0')
  const pendingCount = parseInt(pendingInvites[0]?.count ?? '0')

  return (
    <div className="container-app py-8 space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-heading text-foreground">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground mt-1">
          {business?.name} · {business?.verification_status === 'verified' ? '✅ Verified' : '⏳ Verification pending'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card-base flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-green-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{activeCount}</p>
            <p className="text-sm text-muted-foreground">Active sessions</p>
          </div>
        </div>

        <div className="card-base flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-orange-700" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            <p className="text-sm text-muted-foreground">Pending invitations</p>
          </div>
        </div>

        <Link href="/discovery" className="card-base flex items-center gap-4 hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-brand-brown/10 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5 text-brand-brown" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Find businesses</p>
            <p className="text-sm text-muted-foreground">Search global partners</p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-brown transition-colors shrink-0" />
        </Link>
      </div>

      {/* Quick search */}
      <div className="card-base">
        <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
          <Search className="w-4 h-4" /> Quick discovery
        </h2>
        <Link href="/discovery">
          <div className="input-base flex items-center gap-2 text-muted-foreground cursor-pointer hover:bg-secondary transition-colors">
            <Search className="w-4 h-4 shrink-0" />
            I'm looking for a company that deals with…
          </div>
        </Link>
      </div>

      {/* Recent receipts */}
      {recentReceipts.length > 0 && (
        <div className="card-base">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <FileText className="w-4 h-4" /> Recent receipts
            </h2>
            <Link href="/receipts" className="text-sm text-brand-brown hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {recentReceipts.map((r) => (
              <Link
                key={r.id}
                href={`/receipts/${r.id}`}
                className="flex items-center justify-between py-2 border-b border-border last:border-0 hover:text-brand-brown transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.issuer_name} → {r.receiver_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(r.created_at)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-mono font-semibold">
                    {r.currency} {Number(r.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <span className={`text-xs font-medium ${
                    r.status === 'acknowledged' ? 'text-green-600' :
                    r.status === 'sent' ? 'text-brand-brown' : 'text-muted-foreground'
                  }`}>{r.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
