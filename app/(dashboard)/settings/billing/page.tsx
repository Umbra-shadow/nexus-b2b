'use client'

import { Lock } from 'lucide-react'

const PLAN_FEATURES = {
  starter: {
    name: 'Starter',
    price: 'Free',
    features: [
      '5 discovery searches / month',
      '2 active deal sessions',
      'Basic AI introductions',
      'Email support',
    ],
  },
  growth: {
    name: 'Growth',
    price: '$49 / month',
    features: [
      'Unlimited discovery searches',
      '20 active deal sessions',
      'Priority AI introductions',
      'Analytics dashboard',
      'Priority email support',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$199 / month',
    features: [
      'Everything in Growth',
      'Unlimited deal sessions',
      'API access',
      'Dedicated account manager',
      'Custom branding',
      'SLA guarantee',
    ],
  },
}

const UPGRADE_PLANS = [
  {
    id: 'growth',
    name: 'Growth',
    price: '$49',
    priceDetail: 'per month',
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$199',
    priceDetail: 'per month',
    highlight: false,
  },
]

const MOCK_HISTORY = [
  { month: 'June 2026',     plan: 'Starter', amount: '$0.00',  status: 'Free' },
  { month: 'May 2026',      plan: 'Starter', amount: '$0.00',  status: 'Free' },
  { month: 'April 2026',    plan: 'Starter', amount: '$0.00',  status: 'Free' },
]

export default function BillingPage() {
  const current = PLAN_FEATURES.starter

  return (
    <div style={{ position: 'relative' }}>
      {/* ── Current plan ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 14 }}>Current Plan</div>
        <div style={{
          border: '1px solid #c44b1b',
          background: 'rgba(196,75,27,0.04)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--nx-fg-strong)', letterSpacing: '0.06em' }}>
                {current.name}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', background: '#c44b1b', color: '#fff' }}>
                Active
              </span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)' }}>{current.price}</div>
          </div>
          <div style={{ display: 'flex', flex: 1, flexWrap: 'wrap', gap: 10, minWidth: 200 }}>
            {current.features.map((f) => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#5a9a7a' }}>✓</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)' }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upgrade options ── */}
      <section style={{ marginBottom: 36 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 14 }}>Upgrade Plan</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {UPGRADE_PLANS.map((plan) => (
            <div
              key={plan.id}
              style={{
                border: '1px solid var(--nx-border)',
                background: 'var(--nx-raised)',
                padding: '20px 20px',
                opacity: 0.55,
                cursor: 'default',
                position: 'relative',
              }}
            >
              <div style={{
                position: 'absolute', top: 12, right: 12,
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '3px 8px',
                background: 'var(--nx-bg)',
                border: '1px solid var(--nx-border)',
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-muted)',
              }}>
                <Lock size={8} /> Demo
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>{plan.name}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, lineHeight: 1, color: 'var(--nx-fg-strong)', marginBottom: 2 }}>{plan.price}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-muted)', marginBottom: 16 }}>{plan.priceDetail}</div>
              <div style={{
                width: '100%', padding: '10px 0',
                border: '1px solid var(--nx-border)',
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                color: 'var(--nx-muted)', textAlign: 'center',
              }}>
                Upgrade to {plan.name}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Payment history ── */}
      <section>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 14 }}>Payment History</div>
        <div style={{ border: '1px solid var(--nx-border)' }}>
          {/* Table header */}
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
            <span>Status</span>
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
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5a9a7a' }}>{row.status}</span>
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
        background: 'rgba(var(--nx-bg-rgb, 255,255,255), 0.72)',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}>
        <div style={{
          border: '1px solid var(--nx-border)',
          background: 'var(--nx-bg)',
          padding: '32px 40px',
          maxWidth: 420,
          textAlign: 'center',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 12 }}>/ Demo Mode</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 0.95, color: 'var(--nx-fg-strong)', marginBottom: 12, textTransform: 'uppercase' }}>
            Billing &amp; Subscriptions
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.65, color: 'var(--nx-muted)' }}>
            For demo purposes, this section is not active. Subscription management and payment processing will be enabled at launch.
          </p>
        </div>
      </div>
    </div>
  )
}
