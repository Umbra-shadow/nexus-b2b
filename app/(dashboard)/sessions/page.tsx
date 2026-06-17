import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import Link from 'next/link'
import { formatDateTime } from '@/lib/utils'
import type { SessionStatus } from '@/types/session'

export const metadata = { title: 'Sessions' }

interface SessionRow {
  id: string
  status: SessionStatus
  created_at: string
  accepted_at: string | null
  other_business_name: string
  is_initiator: boolean
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_DOT: Record<string, string> = {
  active: '#5a9a7a',
  pending: '#c44b1b',
  closed: 'var(--nx-muted)',
}
const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  pending: 'Pending',
  closed: 'Closed',
}

export default async function SessionsPage() {
  const session = await auth()
  const user = session!.user

  const sessions = await query<SessionRow>(
    `SELECT s.id, s.status, s.created_at, s.accepted_at,
       CASE WHEN s.initiator_business_id = $1 THEN rb.name ELSE ib.name END as other_business_name,
       (s.initiator_business_id = $1) as is_initiator
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     WHERE s.initiator_business_id = $1 OR s.receiver_business_id = $1
     ORDER BY s.created_at DESC`,
    [user.businessId]
  )

  const grouped = {
    active: sessions.filter((s) => s.status === 'active'),
    pending: sessions.filter((s) => s.status === 'pending'),
    closed: sessions.filter((s) => s.status === 'closed'),
  }

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Sessions</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>DEAL ROOMS</h1>
        </div>
        <Link href="/discovery" style={{ border: '1px solid #c44b1b', color: '#c44b1b', padding: '13px 22px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', textDecoration: 'none' }}>＋ New session</Link>
      </div>

      {sessions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 64, color: 'var(--nx-strong)', marginBottom: 16 }}>◈</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-muted)', marginBottom: 12 }}>No sessions yet.</p>
          <Link href="/discovery" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none' }}>
            Find a business to connect with →
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {(['active', 'pending', 'closed'] as const).map((status) => {
            const group = grouped[status]
            if (group.length === 0) return null
            return (
              <div key={status}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 0 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 9999, background: STATUS_DOT[status], display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>{STATUS_LABEL[status]}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)' }}>({group.length})</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--nx-border)' }} />
                </div>
                {/* Rows */}
                <div style={{ border: '1px solid var(--nx-border)', borderTop: 'none' }}>
                  {group.map((s) => (
                    <Link
                      key={s.id}
                      href={`/sessions/${s.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--nx-line)',
                        textDecoration: 'none',
                      }}
                    >
                      {/* Initials */}
                      <div style={{
                        width: 36,
                        height: 36,
                        border: '1px solid var(--nx-strong)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: 'var(--font-display)',
                        fontSize: 16,
                        color: 'var(--nx-fg-strong)',
                        flexShrink: 0,
                      }}>
                        {getInitials(s.other_business_name)}
                      </div>
                      {/* Name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)', marginBottom: 2 }}>{s.other_business_name}</div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>
                          {s.is_initiator ? 'You initiated' : 'They contacted you'} · {formatDateTime(s.created_at)}
                        </div>
                      </div>
                      {/* Status tag */}
                      <span style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 8,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: STATUS_DOT[status],
                        border: `1px solid ${STATUS_DOT[status]}`,
                        padding: '3px 8px',
                        flexShrink: 0,
                        opacity: 0.8,
                      }}>
                        {status}
                      </span>
                      {/* Arrow */}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--nx-subtle)', flexShrink: 0 }}>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
