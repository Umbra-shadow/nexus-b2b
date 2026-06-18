import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Business Registry — System Admin' }

interface BusinessRow {
  id: string
  name: string
  slug: string
  industry: string
  country: string
  city: string | null
  website: string | null
  verification_status: string
  created_at: string
  admin_email: string | null
  user_count: string
  session_count: string
}

interface CountRow {
  status: string
  count: string
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const STATUS_COLOR: Record<string, string> = {
  verified: '#5a9a7a',
  pending: '#c44b1b',
  rejected: 'var(--nx-muted)',
}
const STATUS_BORDER: Record<string, string> = {
  verified: 'rgba(90,154,122,0.35)',
  pending: 'rgba(196,75,27,0.35)',
  rejected: 'var(--nx-border)',
}

export default async function BusinessesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const { status } = await searchParams
  const filterStatus = status || null

  const [businesses, counts] = await Promise.all([
    query<BusinessRow>(
      `SELECT b.id, b.name, b.slug, b.industry, b.country, b.city, b.website,
              b.verification_status, b.created_at,
              u.email as admin_email,
              (SELECT COUNT(*) FROM users WHERE business_id = b.id)::text as user_count,
              (SELECT COUNT(*) FROM sessions WHERE initiator_business_id = b.id OR receiver_business_id = b.id)::text as session_count
       FROM businesses b
       LEFT JOIN users u ON u.business_id = b.id AND u.role = 'business_admin'
       WHERE ($1::text IS NULL OR b.verification_status::text = $1::text)
       ORDER BY b.created_at DESC`,
      [filterStatus]
    ),
    query<CountRow>(
      `SELECT verification_status as status, COUNT(*)::text as count FROM businesses GROUP BY verification_status`
    ),
  ])

  const countMap: Record<string, number> = { all: 0 }
  for (const row of counts) {
    countMap[row.status] = parseInt(row.count)
    countMap.all = (countMap.all ?? 0) + parseInt(row.count)
  }

  const tabs = [
    { label: 'All', value: null, count: countMap.all ?? 0, orange: false },
    { label: 'Pending', value: 'pending', count: countMap.pending ?? 0, orange: true },
    { label: 'Verified', value: 'verified', count: countMap.verified ?? 0, orange: false },
    { label: 'Rejected', value: 'rejected', count: countMap.rejected ?? 0, orange: false },
  ]

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>
          / Businesses
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 24 }}>
          BUSINESS REGISTRY
        </h1>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 0, border: '1px solid var(--nx-border)', width: 'fit-content' }}>
          {tabs.map((tab) => {
            const isActive = filterStatus === tab.value || (tab.value === null && !filterStatus)
            const href = tab.value ? `/admin/businesses?status=${tab.value}` : '/admin/businesses'
            return (
              <Link
                key={tab.label}
                href={href}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase',
                  textDecoration: 'none',
                  color: isActive ? (tab.orange ? '#c44b1b' : 'var(--nx-fg-strong)') : 'var(--nx-muted)',
                  background: isActive ? 'var(--nx-raised)' : 'transparent',
                  borderRight: '1px solid var(--nx-border)',
                  borderBottom: isActive ? '2px solid #c44b1b' : '2px solid transparent',
                }}
              >
                {tab.label}
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: tab.orange ? '#c44b1b' : 'var(--nx-muted)', background: tab.orange ? 'rgba(196,75,27,0.1)' : 'var(--nx-raised)', padding: '1px 5px' }}>
                  {tab.count}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Card grid — 3 columns */}
      {businesses.length === 0 ? (
        <div style={{ border: '1px solid var(--nx-border)', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
          No businesses{filterStatus ? ` with status "${filterStatus}"` : ''}.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--nx-border)' }}>
          {businesses.map((biz) => (
            <div key={biz.id} style={{ background: 'var(--nx-panel)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Top: avatar + name */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 40, height: 40, border: '1px solid var(--nx-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
                  {getInitials(biz.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)', fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>{biz.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>
                    {biz.industry} · {biz.country}{biz.city ? `, ${biz.city}` : ''}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px', border: `1px solid ${STATUS_BORDER[biz.verification_status] ?? 'var(--nx-border)'}`, color: STATUS_COLOR[biz.verification_status] ?? 'var(--nx-muted)', flexShrink: 0 }}>
                  {biz.verification_status}
                </span>
              </div>

              {/* Meta row */}
              <div style={{ display: 'flex', gap: 20, borderTop: '1px solid var(--nx-line)', paddingTop: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--nx-fg-strong)' }}>{biz.user_count}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 3 }}>Members</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: 'var(--nx-fg-strong)' }}>{biz.session_count}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 3 }}>Sessions</div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', alignSelf: 'flex-end' }}>{formatDate(biz.created_at)}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/admin/businesses/${biz.id}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none', padding: '7px 14px', border: '1px solid rgba(196,75,27,0.35)' }}>
                  Edit →
                </Link>

                {biz.verification_status === 'pending' && (
                  <>
                    <form action={`/api/admin/verify/${biz.id}`} method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="action" value="approve" />
                      <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid rgba(90,154,122,0.5)', color: '#5a9a7a', background: 'rgba(90,154,122,0.06)', cursor: 'pointer' }}>
                        ✓ Approve
                      </button>
                    </form>
                    <form action={`/api/admin/verify/${biz.id}`} method="POST" style={{ display: 'inline' }}>
                      <input type="hidden" name="action" value="reject" />
                      <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid rgba(196,75,27,0.35)', color: '#c44b1b', background: 'rgba(196,75,27,0.06)', cursor: 'pointer' }}>
                        ✗ Reject
                      </button>
                    </form>
                  </>
                )}

                {biz.verification_status !== 'pending' && biz.admin_email && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, minWidth: 0 }}>
                    {biz.admin_email}
                  </span>
                )}
              </div>

              {/* Request info (pending only) */}
              {biz.verification_status === 'pending' && (
                <details style={{ borderTop: '1px solid var(--nx-line)', paddingTop: 10 }}>
                  <summary style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-muted)', cursor: 'pointer', listStyle: 'none', userSelect: 'none' }}>
                    ✉ Request more info
                  </summary>
                  <form action={`/api/admin/verify/${biz.id}`} method="POST" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <input type="hidden" name="action" value="request_info" />
                    <textarea name="reason" rows={2} placeholder="What additional information is needed?" required style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '8px 12px', resize: 'vertical', outline: 'none', width: '100%' }} />
                    <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 16px', border: '1px solid var(--nx-border)', color: 'var(--nx-fg)', background: 'var(--nx-bg)', cursor: 'pointer', alignSelf: 'flex-start' }}>
                      Send →
                    </button>
                  </form>
                </details>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
