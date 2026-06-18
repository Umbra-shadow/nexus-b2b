import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { CleanupByEmail } from '@/components/admin/CleanupByEmail'

export const metadata = { title: 'User Registry — System Admin' }

interface BizRow {
  id: string
  name: string
  industry: string
  country: string
  city: string | null
  verification_status: string
  user_count: string
  admin_email: string | null
}

const STATUS_COLOR: Record<string, string> = {
  verified: '#5a9a7a', pending: '#c44b1b', rejected: 'var(--nx-muted)',
}
const STATUS_BORDER: Record<string, string> = {
  verified: 'rgba(90,154,122,0.35)', pending: 'rgba(196,75,27,0.35)', rejected: 'var(--nx-border)',
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export default async function UsersPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const [businesses, totals] = await Promise.all([
    query<BizRow>(`
      SELECT b.id, b.name, b.industry, b.country, b.city, b.verification_status,
             COUNT(u.id)::text as user_count,
             MAX(CASE WHEN u.role = 'business_admin' THEN u.email END) as admin_email
      FROM businesses b
      LEFT JOIN users u ON u.business_id = b.id
      GROUP BY b.id
      ORDER BY b.name ASC
    `),
    query<{ total: string }>(`SELECT COUNT(*)::text as total FROM users`),
  ])

  const total = parseInt(totals[0]?.total ?? '0')

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>
          / Users
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 10 }}>
          USER REGISTRY
        </h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)' }}>
          {total} total accounts across {businesses.length} businesses — click a card to manage members.
        </p>
      </div>

      {/* Account cleanup tool */}
      <CleanupByEmail />

      {/* 3-column card grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, background: 'var(--nx-border)' }}>
        {businesses.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: 'var(--nx-panel)', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
            No businesses yet.
          </div>
        ) : (
          businesses.map((biz) => (
            <Link
              key={biz.id}
              href={`/admin/users/${biz.id}`}
              style={{ background: 'var(--nx-panel)', padding: 24, display: 'flex', alignItems: 'flex-start', gap: 16, textDecoration: 'none' }}
            >
              {/* Avatar */}
              <div style={{ width: 44, height: 44, border: '1px solid var(--nx-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
                {getInitials(biz.name)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 5 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', fontWeight: 600, lineHeight: 1.3 }}>{biz.name}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 8px', border: `1px solid ${STATUS_BORDER[biz.verification_status] ?? 'var(--nx-border)'}`, color: STATUS_COLOR[biz.verification_status] ?? 'var(--nx-muted)', flexShrink: 0 }}>
                    {biz.verification_status}
                  </span>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 10 }}>
                  {biz.industry} · {biz.country}{biz.city ? `, ${biz.city}` : ''}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: 'var(--nx-fg-strong)' }}>{biz.user_count}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>members</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b' }}>Manage →</span>
                </div>

                {biz.admin_email && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {biz.admin_email}
                  </div>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
