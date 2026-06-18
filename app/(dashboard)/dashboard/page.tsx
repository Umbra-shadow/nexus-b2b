import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import { DiscoverySearch } from '@/components/dashboard/DiscoverySearch'
import { RemindersWidget } from '@/components/dashboard/RemindersWidget'

export const metadata = { title: 'Dashboard' }

const STATUS_COLOR: Record<string, string> = {
  active: '#5a9a7a',
  pending: '#c8a240',
  closed: 'var(--nx-muted)',
}
const STATUS_BORDER: Record<string, string> = {
  active: '#274a3a',
  pending: '#4a4020',
  closed: 'var(--nx-strong)',
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

function getDayLabel() {
  const now = new Date()
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' })
  const day = now.getDate()
  const month = now.toLocaleDateString('en-US', { month: 'long' })
  return `/ ${weekday} · ${day} ${month}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'GOOD MORNING'
  if (h < 17) return 'GOOD AFTERNOON'
  return 'GOOD EVENING'
}

export default async function DashboardPage() {
  const session = await auth()
  const user = session!.user

  const [activeSessions, pendingRows, receiptRows, recentSessions, business, networkCount] = await Promise.all([
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sessions WHERE (initiator_business_id = $1 OR receiver_business_id = $1) AND status = 'active'`,
      [user.businessId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM sessions WHERE (initiator_business_id = $1 OR receiver_business_id = $1) AND status = 'pending'`,
      [user.businessId]
    ),
    query<{ count: string; pending_ack: string }>(
      `SELECT COUNT(*) as count,
              COUNT(CASE WHEN receiver_business_id = $1 AND status = 'sent' THEN 1 END) as pending_ack
       FROM receipts WHERE issuer_business_id = $1 OR receiver_business_id = $1`,
      [user.businessId]
    ),
    query<{ id: string; status: string; created_at: string; other_business_name: string; other_business_industry: string }>(
      `SELECT s.id, s.status, s.created_at,
              CASE WHEN s.initiator_business_id = $1 THEN rb.name ELSE ib.name END as other_business_name,
              CASE WHEN s.initiator_business_id = $1 THEN rb.industry ELSE ib.industry END as other_business_industry
       FROM sessions s
       JOIN businesses ib ON ib.id = s.initiator_business_id
       JOIN businesses rb ON rb.id = s.receiver_business_id
       WHERE s.initiator_business_id = $1 OR s.receiver_business_id = $1
       ORDER BY s.created_at DESC LIMIT 5`,
      [user.businessId]
    ),
    queryOne<{ name: string; city: string; verification_status: string; created_at: string | null }>(
      `SELECT name, city, verification_status, created_at FROM businesses WHERE id = $1`,
      [user.businessId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(*) as count FROM businesses WHERE verification_status = 'verified'`,
      []
    ),
  ])

  const activeCount = parseInt(activeSessions[0]?.count ?? '0')
  const pendingCount = parseInt(pendingRows[0]?.count ?? '0')
  const receiptCount = parseInt(receiptRows[0]?.count ?? '0')
  const pendingAck = parseInt(receiptRows[0]?.pending_ack ?? '0')
  const netCount = parseInt(networkCount[0]?.count ?? '0')
  const firstName = user.name.split(' ')[0].toUpperCase()

  const verifiedDate = business?.created_at
    ? new Date(business.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  const dashStats = [
    { label: 'Active sessions', value: String(activeCount), color: 'var(--nx-fg-strong)', note: 'in your deal rooms' },
    { label: 'Pending requests', value: String(pendingCount), color: '#c44b1b', note: 'awaiting acceptance' },
    { label: 'Receipts', value: String(receiptCount), color: 'var(--nx-fg-strong)', note: pendingAck > 0 ? `${pendingAck} to acknowledge` : 'all settled' },
    { label: 'Network reach', value: `${netCount}`, color: 'var(--nx-fg-strong)', note: 'verified firms on network' },
  ]

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>
            {getDayLabel()}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>
            {getGreeting()}, {firstName}.
          </h1>
        </div>
        <Link
          href="/discovery"
          style={{ background: '#c44b1b', padding: '14px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          ＋ New session
        </Link>
      </div>

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--nx-border)', marginBottom: 32 }}>
        {dashStats.map((s, i) => (
          <div key={s.label} style={{ padding: '26px 24px', borderRight: i < 3 ? '1px solid var(--nx-border)' : undefined }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 14 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 60, lineHeight: 0.85, color: s.color }}>{s.value}</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-subtle)', marginTop: 8 }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* Bottom 2-col */}
      <div className="nx-dash-bottom">
        {/* Recent activity */}
        <div style={{ border: '1px solid var(--nx-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--nx-border)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)' }}>Recent activity</div>
            <Link href="/sessions" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: '#c44b1b', textDecoration: 'none' }}>All sessions →</Link>
          </div>
          {recentSessions.length === 0 ? (
            <div style={{ padding: '24px', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', fontStyle: 'italic' }}>No sessions yet.</div>
          ) : (
            recentSessions.map((s) => (
              <Link key={s.id} href={`/sessions/${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 24px', borderBottom: '1px solid var(--nx-line)', textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
                  {getInitials(s.other_business_name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', lineHeight: 1.25 }}>{s.other_business_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: STATUS_COLOR[s.status] ?? 'var(--nx-muted)' }}>
                      {s.status}
                    </span>
                    <span style={{ width: 2, height: 2, borderRadius: 9999, background: 'var(--nx-strong)', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.other_business_industry}</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-subtle)', flexShrink: 0 }}>→</span>
              </Link>
            ))
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Find a partner */}
          <div style={{ border: '1px solid var(--nx-border)', padding: 24, backgroundImage: 'radial-gradient(ellipse at 100% 0%,rgba(196,75,27,0.07),transparent 60%)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 14 }}>Find a partner</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.5, marginBottom: 18 }}>
              Describe who you&apos;re looking for in plain language. AI matches against verified profiles.
            </p>
            <DiscoverySearch />
          </div>

          {/* Verification status */}
          <div style={{ border: '1px solid var(--nx-border)', padding: 24 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 16 }}>Verification status</div>
            {business?.verification_status === 'verified' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, background: '#5a9a7a', borderRadius: 9999, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)' }}>Verified business</span>
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-subtle)', lineHeight: 1.5 }}>
                  Your profile is public and discoverable.{verifiedDate ? ` Verified ${verifiedDate}.` : ''}
                </p>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ width: 8, height: 8, background: '#c8a240', borderRadius: 9999, display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)' }}>Pending verification</span>
                </div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-subtle)', lineHeight: 1.5 }}>
                  Your application is under review. You&apos;ll appear in discovery once verified.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Reminders */}
      <RemindersWidget />
    </div>
  )
}
