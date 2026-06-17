'use client'

import Link from 'next/link'
import { MarketingShell } from './MarketingShell'

/* ---------- Page scaffold ---------- */

export function InfoPage({
  eyebrow,
  title,
  accentWord,
  lede,
  children,
}: {
  eyebrow: string
  title: string
  accentWord?: string
  lede?: string
  children: React.ReactNode
}) {
  return (
    <MarketingShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
        {/* Hero header */}
        <header style={{ padding: '72px 0 48px', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 24 }}>
            {eyebrow}
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px,8vw,108px)', lineHeight: 0.88, letterSpacing: '0.01em', color: 'var(--nx-fg-strong)', marginBottom: lede ? 28 : 0, textTransform: 'uppercase' }}>
            {title}{accentWord ? <> <span style={{ color: '#c44b1b' }}>{accentWord}</span></> : null}
          </h1>
          {lede && (
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.7, color: 'var(--nx-muted)', maxWidth: 680 }}>
              {lede}
            </p>
          )}
        </header>
        <div style={{ padding: '48px 0 80px', animation: 'nx-rise 0.4s ease' }}>
          {children}
        </div>
      </div>
    </MarketingShell>
  )
}

/* ---------- Section heading ---------- */

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, lineHeight: 1, letterSpacing: '0.02em', color: 'var(--nx-fg-strong)', textTransform: 'uppercase', marginBottom: 24 }}>
      {children}
    </h2>
  )
}

export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.75, color: 'var(--nx-muted)', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {children}
    </div>
  )
}

/* ---------- Numbered steps ---------- */

export function StepGrid({ steps }: { steps: { n: string; title: string; body: string }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', border: '1px solid var(--nx-border)', borderBottom: 'none' }}>
      {steps.map((s) => (
        <div key={s.n} style={{ padding: 28, borderBottom: '1px solid var(--nx-border)', borderRight: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: '#c44b1b', marginBottom: 16 }}>{s.n}</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: 'var(--nx-fg-strong)', marginBottom: 8, lineHeight: 1.3 }}>{s.title}</div>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.6, color: 'var(--nx-muted)' }}>{s.body}</p>
        </div>
      ))}
    </div>
  )
}

/* ---------- Feature list ---------- */

export function FeatureRows({ items }: { items: { title: string; body: string }[] }) {
  return (
    <div style={{ border: '1px solid var(--nx-border)' }}>
      {items.map((it, i) => (
        <div key={it.title} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 18, padding: '24px 28px', borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#c44b1b', paddingTop: 4 }}>{String(i + 1).padStart(2, '0')}</div>
          <div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 19, color: 'var(--nx-fg-strong)', marginBottom: 6 }}>{it.title}</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.65, color: 'var(--nx-muted)' }}>{it.body}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ---------- Stat strip ---------- */

export function StatStrip({ stats }: { stats: { value: string; label: string; accent?: boolean }[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length},1fr)`, border: '1px solid var(--nx-border)' }} className="nx-statstrip">
      {stats.map((s, i) => (
        <div key={s.label} style={{ padding: '24px 26px', borderRight: i === stats.length - 1 ? 'none' : '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 46, lineHeight: 0.9, color: s.accent ? '#c44b1b' : 'var(--nx-fg-strong)' }}>{s.value}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>{s.label}</div>
        </div>
      ))}
      <style>{`@media (max-width:680px){.nx-statstrip{grid-template-columns:1fr 1fr !important;}}`}</style>
    </div>
  )
}

/* ---------- CTA band ---------- */

export function CtaBand({ heading, sub }: { heading: string; sub: string }) {
  return (
    <div style={{ border: '1px solid #7a2a0c', background: 'linear-gradient(180deg,rgba(196,75,27,0.05),transparent)', padding: '40px 36px', marginTop: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap' }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 34, lineHeight: 1, color: 'var(--nx-fg-strong)', textTransform: 'uppercase', marginBottom: 10 }}>{heading}</div>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', maxWidth: 480 }}>{sub}</p>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <Link href="/auth/register" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '16px 30px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Verify your business</Link>
        <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-fg)', border: '1px solid var(--nx-strong)', padding: '16px 30px', textDecoration: 'none', whiteSpace: 'nowrap' }}>Enter demo →</Link>
      </div>
    </div>
  )
}

/* ---------- Legal document ---------- */

export function LegalDoc({
  updated,
  intro,
  clauses,
}: {
  updated: string
  intro: string
  clauses: { heading: string; body: string[] }[]
}) {
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 24 }}>
        Last updated: {updated}
      </div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, lineHeight: 1.75, color: 'var(--nx-muted)', marginBottom: 8 }}>{intro}</p>
      <div style={{ borderTop: '1px solid var(--nx-line)', marginTop: 32 }}>
        {clauses.map((c, i) => (
          <div key={c.heading} style={{ padding: '28px 0', borderBottom: '1px solid var(--nx-line)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 14 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#c44b1b' }}>{String(i + 1).padStart(2, '0')}</span>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.02em', color: 'var(--nx-fg-strong)', textTransform: 'uppercase' }}>{c.heading}</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingLeft: 26 }}>
              {c.body.map((p, j) => (
                <p key={j} style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.7, color: 'var(--nx-muted)' }}>{p}</p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
