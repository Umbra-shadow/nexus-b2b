import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { formatDate } from '@/lib/utils'
import { EmailDiagnostic } from '@/components/admin/EmailDiagnostic'

export const metadata = { title: 'Operations — System Admin' }

interface Stats {
  total_businesses: string
  verified_businesses: string
  pending_verification: string
  total_users: string
  active_sessions: string
  total_receipts: string
}

interface RecentBusiness {
  name: string
  verification_status: string
  industry: string
  country: string
  created_at: string
}

interface RecentSession {
  id: string
  status: string
  created_at: string
  initiator_name: string
  receiver_name: string
}

const STATUS_COLOR: Record<string, string> = {
  verified: '#5a9a7a',
  pending: '#c44b1b',
  rejected: 'var(--nx-muted)',
  active: '#5a9a7a',
  closed: 'var(--nx-muted)',
}

const STATUS_BORDER: Record<string, string> = {
  verified: 'rgba(90,154,122,0.35)',
  pending: 'rgba(196,75,27,0.35)',
  rejected: 'var(--nx-border)',
  active: 'rgba(90,154,122,0.35)',
  closed: 'var(--nx-border)',
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default async function AdminOverviewPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const [statsRows, recentBusinesses, recentSessions] = await Promise.all([
    query<Stats>(`
      SELECT
        (SELECT COUNT(*) FROM businesses) as total_businesses,
        (SELECT COUNT(*) FROM businesses WHERE verification_status = 'verified') as verified_businesses,
        (SELECT COUNT(*) FROM businesses WHERE verification_status = 'pending') as pending_verification,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM sessions WHERE status = 'active') as active_sessions,
        (SELECT COUNT(*) FROM receipts) as total_receipts
    `),
    query<RecentBusiness>(`
      SELECT b.name, b.verification_status, b.industry, b.country, b.created_at
      FROM businesses b ORDER BY b.created_at DESC LIMIT 5
    `),
    query<RecentSession>(`
      SELECT s.id, s.status, s.created_at,
             ib.name as initiator_name, rb.name as receiver_name
      FROM sessions s
      JOIN businesses ib ON ib.id = s.initiator_business_id
      JOIN businesses rb ON rb.id = s.receiver_business_id
      ORDER BY s.created_at DESC LIMIT 5
    `),
  ])

  const stats = statsRows[0] ?? {} as Stats

  const statCards = [
    { label: 'Total businesses', value: stats.total_businesses ?? '0', note: 'registered on platform', orange: false },
    { label: 'Verified businesses', value: stats.verified_businesses ?? '0', note: 'discoverable in network', orange: false },
    { label: 'Pending verification', value: stats.pending_verification ?? '0', note: 'awaiting review', orange: true },
    { label: 'Total users', value: stats.total_users ?? '0', note: 'accounts created', orange: false },
    { label: 'Active sessions', value: stats.active_sessions ?? '0', note: 'live deal rooms', orange: false },
    { label: 'Total receipts', value: stats.total_receipts ?? '0', note: 'transactions recorded', orange: false },
  ]

  return (
    <div style={{ animation: 'nx-rise 0.4s ease' }}>
      {/* Demo disclaimer */}
      <div style={{ padding: '16px 28px', background: 'rgba(196,75,27,0.07)', borderBottom: '1px solid rgba(196,75,27,0.2)' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 5 }}>
          ◈ Live Demonstration — For Judges
        </div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', lineHeight: 1.7, maxWidth: 880 }}>
          The entire system is operational: AWS Aurora PostgreSQL, DynamoDB, S3, and SES are all live and connected.
          The businesses, users, and transactions visible here are <strong>fictional data seeded for demonstration purposes</strong> — not real entities.
          AI responses in deal sessions are powered by Gemini and simulate the receiving business replying autonomously.
          To test the full flow end-to-end, create two real accounts and open a session between them.{' '}
          <strong style={{ color: '#c44b1b' }}>A Gemini API key must be entered in the top bar for AI features to function.</strong>
        </div>
      </div>

      <div style={{ padding: '36px 40px' }}>
        <EmailDiagnostic />

        {/* Page header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: '#c44b1b',
            marginBottom: 10,
          }}>
            / System Admin
          </div>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 52,
            lineHeight: 0.9,
            color: 'var(--nx-fg-strong)',
            marginBottom: 0,
          }}>
            OPERATIONS
          </h1>
        </div>

        {/* Stats grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
          border: '1px solid var(--nx-border)',
          marginBottom: 32,
          background: 'var(--nx-border)',
        }}>
          {statCards.map((card) => (
            <div
              key={card.label}
              style={{
                padding: 24,
                background: 'var(--nx-panel)',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--nx-muted)',
                marginBottom: 14,
              }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 52,
                lineHeight: 0.85,
                color: card.orange ? '#c44b1b' : 'var(--nx-fg-strong)',
                marginBottom: 8,
              }}>
                {card.value}
              </div>
              <div style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 13,
                color: 'var(--nx-muted)',
              }}>
                {card.note}
              </div>
            </div>
          ))}
        </div>

        {/* Two column section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Recent verifications */}
          <div style={{ border: '1px solid var(--nx-border)' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--nx-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--nx-fg)',
            }}>
              Recent Businesses
            </div>
            {recentBusinesses.length === 0 ? (
              <div style={{ padding: 20, fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
                No businesses yet.
              </div>
            ) : (
              recentBusinesses.map((biz, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < recentBusinesses.length - 1 ? '1px solid var(--nx-border)' : undefined,
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    border: '1px solid var(--nx-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-display)',
                    fontSize: 13,
                    color: 'var(--nx-fg-strong)',
                    flexShrink: 0,
                  }}>
                    {getInitials(biz.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {biz.name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 2 }}>
                      {biz.industry} · {biz.country}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '4px 9px',
                      border: `1px solid ${STATUS_BORDER[biz.verification_status] ?? 'var(--nx-border)'}`,
                      color: STATUS_COLOR[biz.verification_status] ?? 'var(--nx-muted)',
                    }}>
                      {biz.verification_status}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>
                      {formatDate(biz.created_at)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Recent sessions */}
          <div style={{ border: '1px solid var(--nx-border)' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--nx-border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'var(--nx-fg)',
            }}>
              Recent Sessions
            </div>
            {recentSessions.length === 0 ? (
              <div style={{ padding: 20, fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
                No sessions yet.
              </div>
            ) : (
              recentSessions.map((s, i) => (
                <div
                  key={s.id}
                  style={{
                    padding: '12px 20px',
                    borderBottom: i < recentSessions.length - 1 ? '1px solid var(--nx-border)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {s.initiator_name} → {s.receiver_name}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      padding: '4px 9px',
                      border: `1px solid ${STATUS_BORDER[s.status] ?? 'var(--nx-border)'}`,
                      color: STATUS_COLOR[s.status] ?? 'var(--nx-muted)',
                      flexShrink: 0,
                    }}>
                      {s.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>
                    {formatDate(s.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
