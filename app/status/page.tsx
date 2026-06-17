import type { Metadata } from 'next'
import { InfoPage } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'System Status',
  description: 'Live operational status of NexusB2B services — discovery, sessions, verification, receipts and the API.',
}

const SERVICES = [
  { name: 'Discovery & Search', status: 'Operational', uptime: '99.98%' },
  { name: 'Deal Sessions', status: 'Operational', uptime: '99.99%' },
  { name: 'Verification Pipeline', status: 'Operational', uptime: '99.95%' },
  { name: 'Receipts & Exports', status: 'Operational', uptime: '100.00%' },
  { name: 'AI Introductions', status: 'Operational', uptime: '99.92%' },
  { name: 'API & Authentication', status: 'Operational', uptime: '99.99%' },
]

const HISTORY = [
  { date: 'Jun 2026', note: 'No incidents reported.' },
  { date: 'May 2026', note: 'Scheduled maintenance on the verification pipeline completed with no downtime.' },
  { date: 'Apr 2026', note: 'No incidents reported.' },
]

export default function StatusPage() {
  return (
    <InfoPage
      eyebrow="/ Trust / Status"
      title="System"
      accentWord="Status"
      lede="Live operational status for every NexusB2B service. We publish uptime transparently so you always know the platform is ready when you are."
    >
      {/* Overall banner */}
      <div style={{ border: '1px solid #2a5a3a', background: 'rgba(90,154,122,0.07)', padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 40 }}>
        <span style={{ width: 10, height: 10, borderRadius: 9999, background: '#5a9a7a', display: 'inline-block', boxShadow: '0 0 0 4px rgba(90,154,122,0.18)' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.02em', color: 'var(--nx-fg-strong)', textTransform: 'uppercase' }}>All Systems Operational</span>
      </div>

      {/* Services table */}
      <div style={{ border: '1px solid var(--nx-border)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, padding: '14px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Service</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', width: 120, textAlign: 'right' }}>90-day uptime</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', width: 120, textAlign: 'right' }}>Status</div>
        </div>
        {SERVICES.map((s, i) => (
          <div key={s.name} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16, alignItems: 'center', padding: '18px 24px', borderBottom: i === SERVICES.length - 1 ? 'none' : '1px solid var(--nx-border)' }}>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-fg-strong)' }}>{s.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-muted)', width: 120, textAlign: 'right' }}>{s.uptime}</div>
            <div style={{ width: 120, textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: 9999, background: '#5a9a7a', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#5a9a7a' }}>{s.status}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Incident history */}
      <div style={{ marginTop: 56 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, letterSpacing: '0.02em', color: 'var(--nx-fg-strong)', textTransform: 'uppercase', marginBottom: 24 }}>Incident history</h2>
        <div style={{ border: '1px solid var(--nx-border)' }}>
          {HISTORY.map((h, i) => (
            <div key={h.date} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 16, padding: '20px 24px', borderBottom: i === HISTORY.length - 1 ? 'none' : '1px solid var(--nx-border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>{h.date}</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6 }}>{h.note}</div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-subtle)', marginTop: 18, letterSpacing: '0.04em' }}>
          Status figures shown are illustrative for this demonstration build.
        </p>
      </div>
    </InfoPage>
  )
}
