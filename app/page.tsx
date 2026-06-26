'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NavDropdown, NAV_MENUS } from '@/components/marketing/NavDropdowns'

function NxLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 26, height: 26, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', top: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', top: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', bottom: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 18, background: '#444', left: '50%', top: 4 }} />
        <div style={{ position: 'absolute', height: 1, width: 18, background: '#444', top: '50%', left: 4 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
        NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
      </span>
    </div>
  )
}

const PREVIEW_BUSINESSES = [
  { initials: 'AT', name: 'Aurora Textiles', industry: 'Manufacturing', city: 'Porto', cc: 'PT' },
  { initials: 'CC', name: 'Cobalt Cloud', industry: 'SaaS / IT', city: 'Berlin', cc: 'DE' },
  { initials: 'SC', name: 'Stonebridge Capital', industry: 'Finance', city: 'London', cc: 'GB' },
  { initials: 'VP', name: 'Verde Packaging', industry: 'Packaging', city: 'Valencia', cc: 'ES' },
]

const LIVE_SESSIONS = [
  { a: 'Stonebridge Capital', b: 'Aurora Textiles', type: 'Contract review', live: true },
  { a: 'Cobalt Cloud', b: 'Meridian Logistics', type: 'NDA exchange', live: false, ago: '34m' },
  { a: 'Verde Packaging', b: 'Europack GmbH', type: 'Term sheet', live: false, ago: '1h 12m' },
  { a: 'Finbridge SA', b: 'Stonebridge Capital', type: 'Due diligence', live: false, ago: '2h' },
]

const TICKER_ITEMS = [
  'Manufacturing', 'Finance', 'SaaS / IT', 'Logistics', 'Packaging',
  'Real Estate', 'Energy', 'Healthcare', 'Agriculture', 'Legal Services',
  'E-commerce', 'Construction', 'Media', 'Insurance', 'Telecoms',
]

const HOW_IT_WORKS = [
  {
    title: 'Verify your business',
    desc: 'Submit your registration documents. Our team confirms identity, ownership, and legitimacy within 24–48 hours. No company appears on the network without it.',
  },
  {
    title: 'Discover in plain language',
    desc: 'Search by industry, size, country, or need — in natural language. Every result is a verified company. No spam, no cold outreach, no guessing.',
  },
  {
    title: 'Open a deal room',
    desc: 'One click opens a structured session. Exchange NDA, negotiate terms, record receipts — everything on-record, AI-mediated, and timestamped.',
  },
]

export default function LandingPage() {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    const saved = localStorage.getItem('nx-theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nx-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const isDark = theme === 'dark'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', position: 'relative' }}>

      {/* Subtle dot-grid depth layer */}
      <div className="nx-dot-grid" aria-hidden="true" />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 1 }}>

        {/* ── Nav ───────────────────────────────────────────────── */}
        <nav style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          height: 64, borderBottom: '1px solid var(--nx-border)', gap: 16,
        }}>
          <NxLogo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            {NAV_MENUS.map((m) => (
              <NavDropdown key={m.label} label={m.label} items={m.items} />
            ))}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: 0, lineHeight: 1, overflow: 'hidden' }}
            >
              <span style={{ padding: '7px 11px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: isDark ? '#c44b1b' : 'transparent', color: isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s' }}>☾ Dark</span>
              <span style={{ width: 1, height: 28, background: 'var(--nx-border)', flexShrink: 0 }} />
              <span style={{ padding: '7px 11px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: !isDark ? '#c44b1b' : 'transparent', color: !isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s' }}>☀ Light</span>
            </button>
            <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg)', textDecoration: 'none' }}>Log in</Link>
            <Link href="/auth/register" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '10px 18px', textDecoration: 'none' }}>Register →</Link>
          </div>
        </nav>

        {/* ── Hero — two-column split ────────────────────────────── */}
        <div className="nx-hero-split" style={{ borderBottom: '1px solid var(--nx-border)' }}>

          {/* Left: text */}
          <div style={{ padding: '80px 0 64px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 6, height: 6, background: '#c44b1b', borderRadius: 9999, display: 'inline-block', animation: 'nx-dot 1.6s infinite' }} />
              Verified B2B Network — Live
            </div>

            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,6vw,92px)', lineHeight: 0.9, letterSpacing: '0.01em', color: 'var(--nx-fg-strong)', marginBottom: 32, animation: 'nx-rise 0.6s ease both' }}>
              THE DEAL ROOM<br />
              FOR{' '}
              <span style={{ position: 'relative', display: 'inline-block' }}>
                <span style={{ color: '#c44b1b' }}>VERIFIED</span>
                <span style={{ position: 'absolute', left: 0, right: 0, bottom: 4, height: 3, background: 'rgba(196,75,27,0.28)' }} />
              </span>
              <br />BUSINESS.
            </h1>

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 19, lineHeight: 1.75, color: 'var(--nx-muted)', maxWidth: 540, marginBottom: 48, animation: 'nx-rise 0.6s ease 0.12s both' }}>
              Cold email is broken. NexusB2B is a closed network where every company is identity-verified before they appear. Discover partners in plain language, open a structured deal session, and exchange receipts — all in one room.
            </p>

            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', animation: 'nx-rise 0.6s ease 0.22s both' }}>
              <Link href="/auth/register" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '16px 32px', textDecoration: 'none', display: 'inline-block', transition: 'opacity 0.15s' }}>
                Verify your business
              </Link>
              <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg)', border: '1px solid var(--nx-strong)', padding: '16px 32px', textDecoration: 'none', display: 'inline-block' }}>
                Enter demo →
              </Link>
            </div>
          </div>

          {/* Right: live sessions panel */}
          <div className="nx-hero-panel-border" style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', minHeight: 400 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 5, height: 5, background: '#c44b1b', borderRadius: 9999, display: 'inline-block', animation: 'nx-dot 1.4s infinite' }} />
                Live sessions
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-subtle)' }}>14 open now</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {LIVE_SESSIONS.map((s, i) => (
                <div key={i} style={{ padding: '15px 0', borderTop: '1px solid var(--nx-line)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    {s.live && (
                      <span style={{ width: 5, height: 5, background: '#c44b1b', borderRadius: 9999, flexShrink: 0, animation: 'nx-dot 1.2s infinite' }} />
                    )}
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', lineHeight: 1.2, paddingLeft: s.live ? 0 : 12 }}>
                      {s.a}
                    </div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', paddingLeft: 12, marginBottom: 8 }}>
                    ↳ {s.b}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 12 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: s.live ? '#c44b1b' : 'var(--nx-subtle)',
                      border: `1px solid ${s.live ? '#7a2a0c' : 'var(--nx-line)'}`,
                      padding: '2px 7px',
                    }}>
                      {s.type}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-faint)', letterSpacing: '0.06em' }}>
                      {s.live ? 'Live now' : `${s.ago} ago`}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--nx-border)', paddingTop: 20, marginTop: 8 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>€140M</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 7 }}>In active session deals</div>
            </div>
          </div>
        </div>

        {/* ── Ticker — industry breadth ──────────────────────────── */}
        <div style={{ borderBottom: '1px solid var(--nx-border)', overflow: 'hidden', padding: '12px 0' }}>
          <div style={{ display: 'flex', animation: 'nx-ticker 28s linear infinite', width: 'max-content' }}>
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={i} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', flexShrink: 0, display: 'inline-flex', alignItems: 'center', padding: '0 24px', gap: 24 }}>
                {item}
                <span style={{ width: 3, height: 3, background: '#c44b1b', borderRadius: 9999, opacity: 0.5, flexShrink: 0 }} />
              </span>
            ))}
          </div>
        </div>

        {/* ── Stat strip ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--nx-border)', borderTop: 'none' }} className="nx-stat-row">
          {[
            { n: '2,400+', l: 'Verified firms' },
            { n: '38',     l: 'Countries' },
            { n: '100%',   l: 'Identity-checked', accent: true },
            { n: '€140M',  l: 'In session deals' },
          ].map((s, i, arr) => (
            <div key={s.l} style={{ padding: '28px 28px', borderRight: i < arr.length - 1 ? '1px solid var(--nx-border)' : undefined }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 54, lineHeight: 0.88, color: s.accent ? '#c44b1b' : 'var(--nx-fg-strong)', marginBottom: 10 }}>{s.n}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>{s.l}</div>
            </div>
          ))}
        </div>

        {/* ── How it works ──────────────────────────────────────── */}
        <div style={{ padding: '72px 0', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 52 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', flexShrink: 0 }}>/ How it works</div>
            <div style={{ flex: 1, height: 1, background: 'var(--nx-line)' }} />
          </div>
          <div className="nx-steps-grid" style={{ border: '1px solid var(--nx-border)' }}>
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} style={{
                padding: '36px 32px',
                borderRight: i < HOW_IT_WORKS.length - 1 ? '1px solid var(--nx-border)' : undefined,
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'absolute', top: -8, right: 12, fontFamily: 'var(--font-display)', fontSize: 96, lineHeight: 1, color: 'var(--nx-line)', userSelect: 'none', pointerEvents: 'none', letterSpacing: '-0.02em' }}>
                  0{i + 1}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.02em', color: 'var(--nx-fg-strong)', marginBottom: 14, lineHeight: 1.15, position: 'relative' }}>
                  {step.title.toUpperCase()}
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.75, color: 'var(--nx-muted)', position: 'relative' }}>
                  {step.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Live network preview ───────────────────────────────── */}
        <div style={{ padding: '56px 0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b' }}>/ Live on the network</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--nx-subtle)' }}>Public profiles · updated continuously</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--nx-border)', borderBottom: 'none' }} className="nx-preview-grid">
            {PREVIEW_BUSINESSES.map((b, i) => (
              <div key={b.name} style={{
                padding: '24px 22px',
                borderBottom: '1px solid var(--nx-border)',
                borderRight: i < PREVIEW_BUSINESSES.length - 1 ? '1px solid var(--nx-border)' : undefined,
                display: 'flex', flexDirection: 'column', gap: 16,
                transition: 'background 0.18s',
              }} className="nx-biz-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ width: 40, height: 40, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--nx-fg-strong)', letterSpacing: '0.04em', flexShrink: 0 }}>{b.initials}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid #7a2a0c', padding: '3px 7px' }}>✓ Verified</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-fg-strong)', lineHeight: 1.2, marginBottom: 5 }}>{b.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', color: 'var(--nx-muted)', textTransform: 'uppercase', marginBottom: 6 }}>{b.industry}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-faint)', letterSpacing: '0.06em' }}>{b.city} · {b.cc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Demo credentials ──────────────────────────────────── */}
        <div style={{ padding: '0 0 80px' }}>
          <div style={{
            border: '1px solid #7a2a0c',
            background: isDark
              ? 'linear-gradient(135deg, rgba(196,75,27,0.09) 0%, rgba(196,75,27,0.02) 60%)'
              : 'linear-gradient(135deg, rgba(196,75,27,0.06) 0%, rgba(196,75,27,0.01) 60%)',
            padding: '32px 36px',
          }} className="nx-creds-wrap">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 5, height: 5, background: '#c44b1b', borderRadius: 9999, animation: 'nx-dot 1.6s infinite' }} />
                  Hackathon judge access
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, letterSpacing: '0.02em', color: 'var(--nx-fg-strong)', marginBottom: 12, lineHeight: 1.05 }}>
                  MERIDIAN LOGISTICS
                </div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, maxWidth: 460 }}>
                  Skip registration. Sign in as <strong style={{ color: 'var(--nx-fg-strong)' }}>Meridian Logistics</strong> to explore discovery, live sessions, AI-mediated intros and receipts with seeded data.
                </div>
              </div>
              <div style={{ display: 'flex', border: '1px solid var(--nx-border)', flexShrink: 0 }} className="nx-creds-box">
                <div style={{ padding: '18px 24px', borderRight: '1px solid var(--nx-border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 8 }}>Email</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>admin@meridian.io</div>
                </div>
                <div style={{ padding: '18px 24px', borderRight: '1px solid var(--nx-border)' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 8 }}>Password</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>demo1234</div>
                </div>
                <Link href="/auth/login" style={{ padding: '18px 24px', background: '#c44b1b', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                  Enter →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--nx-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 40px', position: 'relative', zIndex: 1 }}>
          <div className="nx-footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
                <div style={{ width: 22, height: 22, position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', width: 7, height: 7, background: '#c44b1b', top: 0, left: 0 }} />
                  <div style={{ position: 'absolute', width: 7, height: 7, border: '1px solid #c44b1b', top: 0, right: 0 }} />
                  <div style={{ position: 'absolute', width: 7, height: 7, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
                  <div style={{ position: 'absolute', width: 7, height: 7, background: '#c44b1b', bottom: 0, right: 0 }} />
                </div>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>NEXUS<span style={{ color: '#c44b1b' }}>B2B</span></span>
              </div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.65, color: 'var(--nx-muted)', maxWidth: 300 }}>
                The verified deal room for business. Discover identity-checked partners, open structured sessions, exchange receipts.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['Discovery', '/platform/discovery'], ['Sessions', '/platform/sessions'], ['Receipts', '/platform/receipts'], ['Verification', '/platform/verification']].map(([l, h]) => (
                  <Link key={l} href={h} className="nx-foot-link" style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', textDecoration: 'none' }}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['About', '/about'], ['Careers', '/careers'], ['Contact', '/contact'], ['Press', '/press']].map(([l, h]) => (
                  <Link key={l} href={h} className="nx-foot-link" style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', textDecoration: 'none' }}>{l}</Link>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>Trust</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['Security', '/security'], ['Privacy', '/privacy'], ['Terms', '/terms'], ['Status', '/status']].map(([l, h]) => (
                  <Link key={l} href={h} className="nx-foot-link" style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', textDecoration: 'none' }}>{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-subtle)' }}>© 2026 NexusB2B</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a240', border: '1px solid #4a4020', padding: '4px 9px' }}>Demo build — fictional businesses</span>
            </div>
            <button onClick={toggleTheme} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: isDark ? '#fff' : 'var(--nx-muted)', border: '1px solid var(--nx-border)', padding: '7px 12px', background: isDark ? '#c44b1b' : 'transparent', cursor: 'pointer' }}>
              {isDark ? '☾ Dark' : '☀ Light'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .nx-foot-link:hover { color: #c44b1b !important; }

        @media (max-width: 768px) {
          .nx-stat-row   { grid-template-columns: repeat(2,1fr) !important; }
          .nx-preview-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nx-creds-wrap { grid-template-columns: 1fr !important; }
          .nx-creds-box  { flex-wrap: wrap; }
          .nx-footer-grid { grid-template-columns: 1fr 1fr !important; }
          .nx-steps-grid { border: 1px solid var(--nx-border); }
        }
        @media (max-width: 480px) {
          .nx-stat-row   { grid-template-columns: 1fr !important; }
          .nx-preview-grid { grid-template-columns: 1fr !important; }
          .nx-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
