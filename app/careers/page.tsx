import type { Metadata } from 'next'
import { InfoPage, SectionTitle, Prose, FeatureRows, CtaBand } from '@/components/marketing/InfoPage'

export const metadata: Metadata = {
  title: 'Careers',
  description: 'Help build the verified deal room for business. Open roles across engineering, trust & verification, and growth at NexusB2B.',
}

const ROLES = [
  { title: 'Senior Full-Stack Engineer', team: 'Engineering', location: 'Remote · EU' },
  { title: 'Trust & Verification Analyst', team: 'Trust', location: 'Lisbon / Hybrid' },
  { title: 'Applied AI Engineer', team: 'Engineering', location: 'Remote · Global' },
  { title: 'Product Designer', team: 'Design', location: 'Remote · EU' },
  { title: 'Go-to-Market Lead', team: 'Growth', location: 'London / Hybrid' },
]

export default function CareersPage() {
  return (
    <InfoPage
      eyebrow="/ Company / Careers"
      title="Build With"
      accentWord="Us"
      lede="We are a small team with an outsized mandate: make business trust verifiable by default. If that problem excites you, we should talk."
    >
      <div>
        <SectionTitle>How we work</SectionTitle>
        <FeatureRows
          items={[
            { title: 'Remote-first, async by default', body: 'We optimize for written clarity and deep work over meetings and time zones.' },
            { title: 'Ownership over tickets', body: 'Engineers and designers own outcomes end to end, from problem framing to shipped feature.' },
            { title: 'Trust is everyone\u2019s job', body: 'Verification and security are not a separate department — they shape every decision we make.' },
          ]}
        />
      </div>

      <div style={{ marginTop: 56 }}>
        <SectionTitle>Open roles</SectionTitle>
        <div style={{ border: '1px solid var(--nx-border)' }}>
          {ROLES.map((r, i) => (
            <div
              key={r.title}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.6fr 1fr 1fr auto',
                alignItems: 'center',
                gap: 16,
                padding: '22px 28px',
                borderBottom: i === ROLES.length - 1 ? 'none' : '1px solid var(--nx-border)',
              }}
              className="nx-role-row"
            >
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: 'var(--nx-fg-strong)' }}>{r.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>{r.team}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', color: 'var(--nx-muted)' }}>{r.location}</div>
              <a href="/contact" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid #7a2a0c', padding: '8px 14px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Apply →</a>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 56 }}>
        <Prose>
          <p>
            Don&apos;t see your role? We are always glad to hear from exceptional people. Reach out through our contact
            page and tell us what you&apos;d build.
          </p>
        </Prose>
      </div>

      <CtaBand heading="Want in?" sub="Send us a note through the contact page — include a link to something you are proud of." />
      <style>{`@media(max-width:680px){.nx-role-row{grid-template-columns:1fr 1fr !important;}}`}</style>
    </InfoPage>
  )
}
