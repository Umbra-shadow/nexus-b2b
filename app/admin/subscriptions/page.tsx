import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Subscriptions — System Admin' }

interface BusinessRow {
  id: string
  name: string
  industry: string
  country: string
  verification_status: string
  created_at: string
  admin_email: string | null
}

const PLAN_LABEL: Record<string, string> = {
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

const PLAN_COLOR: Record<string, string> = {
  starter: 'var(--nx-muted)',
  growth: '#5a9a7a',
  enterprise: '#c44b1b',
}

const MOCK_HISTORY = [
  { month: 'June 2026', plan: 'Starter', amount: '$0.00' },
  { month: 'May 2026',  plan: 'Starter', amount: '$0.00' },
  { month: 'April 2026', plan: 'Starter', amount: '$0.00' },
]

export default async function SubscriptionsPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const businesses = await query<BusinessRow>(
    `SELECT b.id, b.name, b.industry, b.country, b.verification_status, b.created_at,
            u.email as admin_email
     FROM businesses b
     LEFT JOIN users u ON u.business_id = b.id AND u.role = 'business_admin'
     ORDER BY b.name ASC
     LIMIT 100`
  )

  const verifiedCount = businesses.filter((b) => b.verification_status === 'verified').length

  return (
    <div style={{ padding: '36px 40px', position: 'relative', minHeight: '100%' }}>

      {/* Header */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ System Admin / Subscriptions</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 28 }}>SUBSCRIPTIONS</h1>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 32 }}>
        {[
          { label: 'Total businesses', value: businesses.length },
          { label: 'Starter (free)',   value: verifiedCount },
          { label: 'Growth',          value: 0 },
          { label: 'Enterprise',      value: 0 },
        ].map((card) => (
          <div key={card.label} style={{ border: '1px solid var(--nx-border)', padding: '16px 20px', background: 'var(--nx-raised)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, color: 'var(--nx-fg-strong)', marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Business subscription table */}
      <section style={{ marginBottom: 40 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 12 }}>
          Business Subscriptions — {businesses.length} registered
        </div>
        <div style={{ border: '1px solid var(--nx-border)' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 140px',
            padding: '10px 16px',
            borderBottom: '1px solid var(--nx-border)',
            background: 'var(--nx-raised)',
            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)',
          }}>
            <span>Business</span>
            <span>Industry</span>
            <span>Status</span>
            <span>Plan</span>
            <span>Registered</span>
            <span>Actions</span>
          </div>
          {businesses.length === 0 ? (
            <div style={{ padding: '32px 16px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)' }}>
              No businesses registered yet.
            </div>
          ) : (
            businesses.map((biz, i) => (
              <div
                key={biz.id}
                style={{
                  display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 140px',
                  padding: '12px 16px',
                  borderBottom: i < businesses.length - 1 ? '1px solid var(--nx-border)' : 'none',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', marginBottom: 2 }}>{biz.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>{biz.admin_email ?? '—'}</div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>
                  {biz.industry}
                </div>
                <div>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '3px 8px',
                    background: biz.verification_status === 'verified' ? 'rgba(90,154,122,0.12)' : 'rgba(196,75,27,0.1)',
                    color: biz.verification_status === 'verified' ? '#5a9a7a' : '#c44b1b',
                    border: `1px solid ${biz.verification_status === 'verified' ? 'rgba(90,154,122,0.3)' : 'rgba(196,75,27,0.3)'}`,
                  }}>
                    {biz.verification_status}
                  </span>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: PLAN_COLOR['starter'] }}>
                  {PLAN_LABEL['starter']}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)' }}>
                  {formatDate(biz.created_at)}
                </div>
                {/* Change plan button — disabled in demo */}
                <button
                  disabled
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                    padding: '6px 10px',
                    border: '1px solid var(--nx-border)',
                    background: 'none',
                    color: 'var(--nx-muted)',
                    cursor: 'not-allowed',
                    opacity: 0.5,
                    width: '100%',
                  }}
                >
                  Change Plan
                </button>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Payment history sample */}
      <section>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 12 }}>
          Platform Payment History (sample)
        </div>
        <div style={{ border: '1px solid var(--nx-border)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
            padding: '10px 16px',
            borderBottom: '1px solid var(--nx-border)',
            background: 'var(--nx-raised)',
            fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)',
          }}>
            <span>Period</span>
            <span>Plan</span>
            <span>Amount</span>
            <span>Businesses</span>
          </div>
          {MOCK_HISTORY.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr',
                padding: '12px 16px',
                borderBottom: i < MOCK_HISTORY.length - 1 ? '1px solid var(--nx-border)' : 'none',
                fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)',
              }}
            >
              <span>{row.month}</span>
              <span>{row.plan}</span>
              <span>{row.amount}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>{businesses.length}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo overlay ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(var(--nx-bg-rgb, 12,12,12), 0.65)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}>
        <div style={{
          border: '1px solid var(--nx-border)',
          background: 'var(--nx-bg)',
          padding: '40px 48px',
          maxWidth: 480,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 14 }}>/ Demo Mode</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 0.92, color: 'var(--nx-fg-strong)', marginBottom: 16, textTransform: 'uppercase' }}>
            Subscription<br />Management
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.7, color: 'var(--nx-muted)' }}>
            For demo purposes, this section is not active. Subscription management, plan changes, and payment tracking will be enabled at launch.
          </p>
        </div>
      </div>

    </div>
  )
}
