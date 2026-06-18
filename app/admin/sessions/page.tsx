import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Session Registry — System Admin' }

interface SessionRow {
  id: string
  status: string
  created_at: string
  accepted_at: string | null
  closed_at: string | null
  initiator_name: string
  receiver_name: string
}

const STATUS_COLOR: Record<string, string> = {
  active: '#5a9a7a',
  pending: '#c44b1b',
  closed: 'var(--nx-muted)',
}

const STATUS_BORDER: Record<string, string> = {
  active: 'rgba(90,154,122,0.35)',
  pending: 'rgba(196,75,27,0.35)',
  closed: 'var(--nx-border)',
}

export default async function SessionsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const sessions = await query<SessionRow>(`
    SELECT s.id, s.status, s.created_at, s.accepted_at, s.closed_at,
           ib.name as initiator_name, rb.name as receiver_name
    FROM sessions s
    JOIN businesses ib ON ib.id = s.initiator_business_id
    JOIN businesses rb ON rb.id = s.receiver_business_id
    ORDER BY s.created_at DESC
    LIMIT 100
  `)

  const statusCounts: Record<string, number> = {}
  for (const s of sessions) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1
  }

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
          / Sessions
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 52,
          lineHeight: 0.9,
          color: 'var(--nx-fg-strong)',
          marginBottom: 16,
        }}>
          SESSION REGISTRY
        </h1>

        {/* Summary pills */}
        <div style={{ display: 'flex', gap: 16 }}>
          {[
            { label: 'Active', key: 'active' },
            { label: 'Pending', key: 'pending' },
            { label: 'Closed', key: 'closed' },
          ].map(({ label, key }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 28,
                lineHeight: 1,
                color: STATUS_COLOR[key] ?? 'var(--nx-muted)',
              }}>
                {statusCounts[key] ?? 0}
              </span>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--nx-muted)',
              }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Table header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 2fr 80px 130px 130px 130px 80px',
        gap: 0,
        padding: '10px 20px',
        border: '1px solid var(--nx-border)',
        borderBottom: 'none',
        background: 'var(--nx-raised)',
      }}>
        {['Initiator', 'Receiver', 'Status', 'Created', 'Accepted', 'Closed', ''].map((h) => (
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
        {sessions.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
            No sessions yet.
          </div>
        ) : (
          sessions.map((s, i) => (
            <div
              key={s.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 80px 130px 130px 130px',
                alignItems: 'center',
                gap: 0,
                padding: '12px 20px',
                borderBottom: i < sessions.length - 1 ? '1px solid var(--nx-border)' : undefined,
              }}
            >
              {/* Initiator */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {s.initiator_name}
              </div>

              {/* Receiver */}
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>
                {s.receiver_name}
              </div>

              {/* Status */}
              <div>
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  padding: '4px 9px',
                  border: `1px solid ${STATUS_BORDER[s.status] ?? 'var(--nx-border)'}`,
                  color: STATUS_COLOR[s.status] ?? 'var(--nx-muted)',
                }}>
                  {s.status}
                </span>
              </div>

              {/* Created */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>
                {formatDate(s.created_at)}
              </div>

              {/* Accepted */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>
                {s.accepted_at ? formatDate(s.accepted_at) : '—'}
              </div>

              {/* Closed */}
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>
                {s.closed_at ? formatDate(s.closed_at) : '—'}
              </div>

              {/* Export */}
              <div>
                <Link href={`/admin/sessions/${s.id}`} target="_blank" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none' }}>
                  ↓ Chat
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {sessions.length === 100 && (
        <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', letterSpacing: '0.08em', textAlign: 'center' }}>
          Showing most recent 100 sessions
        </div>
      )}
    </div>
  )
}
