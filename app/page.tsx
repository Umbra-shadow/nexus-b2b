'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
  { initials: 'AT', name: 'Aurora Textiles', industry: 'Manufacturing', city: 'Porto' },
  { initials: 'CC', name: 'Cobalt Cloud', industry: 'SaaS / IT', city: 'Berlin' },
  { initials: 'SC', name: 'Stonebridge Capital', industry: 'Finance', city: 'London' },
  { initials: 'VP', name: 'Verde Packaging', industry: 'Packaging', city: 'Valencia' },
]

export default function LandingPage() {
  const [theme, setTheme] = useState('dark')

  useEffect(() => {
    const saved = localStorage.getItem('nx-theme') || 'dark'
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
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 80, borderBottom: '1px solid var(--nx-border)', flexWrap: 'wrap', gap: 16 }}>
          <NxLogo />
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', cursor: 'pointer' }}>Platform</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', cursor: 'pointer' }}>Verification</span>
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 0, cursor: 'pointer', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: 0, lineHeight: 1, overflow: 'hidden' }}
            >
              <span style={{ padding: '7px 11px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: isDark ? '#c44b1b' : 'transparent', color: isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s' }}>☾ Dark</span>
              <span style={{ width: 1, height: 28, background: 'var(--nx-border)', flexShrink: 0 }} />
              <span style={{ padding: '7px 11px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: !isDark ? '#c44b1b' : 'transparent', color: !isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s' }}>☀ Light</span>
            </button>
            <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg)', textDecoration: 'none' }}>Log in</Link>
            <Link href="/auth/register" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '10px 18px', textDecoration: 'none' }}>Register →</Link>
          </div>
        </nav>

        {/* Hero — full width, single column */}
        <div style={{ padding: '80px 0 60px', borderBottom: '1px solid var(--nx-border)' }}>

          {/* Live badge */}
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, background: '#c44b1b', borderRadius: 9999, display: 'inline-block', animation: 'nx-dot 1.6s infinite' }} />
            Verified B2B Network — Live
          </div>

          {/* Full-width headline */}
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(48px,7vw,100px)', lineHeight: 0.88, letterSpacing: '0.01em', color: 'var(--nx-fg-strong)', marginBottom: 28 }}>
            THE DEAL ROOM<br />FOR <span style={{ color: '#c44b1b' }}>VERIFIED</span><br />BUSINESS.
          </h1>

          {/* Subtitle */}
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.7, color: 'var(--nx-muted)', maxWidth: 620, marginBottom: 48 }}>
            Cold email is broken. NexusB2B is a closed network where every company is identity-verified before they appear. Discover partners in plain language, open a structured deal session, and exchange receipts — all in one room.
          </p>

          {/* Stat strip — 4 boxes in a row, sits between text and CTAs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--nx-border)', marginBottom: 40 }} className="nx-stat-row">
            <div style={{ padding: '20px 24px', borderRight: '1px solid var(--nx-border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>2,400+</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>Verified firms</div>
            </div>
            <div style={{ padding: '20px 24px', borderRight: '1px solid var(--nx-border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>38</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>Countries</div>
            </div>
            <div style={{ padding: '20px 24px', borderRight: '1px solid var(--nx-border)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: '#c44b1b' }}>100%</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>Identity-checked</div>
            </div>
            <div style={{ padding: '20px 24px' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>€140M</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>In session deals</div>
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href="/auth/register" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '16px 32px', textDecoration: 'none' }}>
              Verify your business
            </Link>
            <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg)', border: '1px solid var(--nx-strong)', padding: '16px 32px', textDecoration: 'none' }}>
              Enter demo →
            </Link>
          </div>
        </div>

        {/* Live preview strip */}
        <div style={{ padding: '48px 0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b' }}>/ Live on the network</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: 'var(--nx-subtle)' }}>Public profiles · updated continuously</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--nx-border)', borderBottom: 'none' }} className="nx-preview-grid">
            {PREVIEW_BUSINESSES.map((b) => (
              <div key={b.name} style={{ padding: 22, borderBottom: '1px solid var(--nx-border)', borderRight: '1px solid var(--nx-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ width: 36, height: 36, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--nx-fg-strong)', letterSpacing: '0.04em' }}>{b.initials}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid #7a2a0c', padding: '3px 6px' }}>✓ Verified</span>
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-fg-strong)', lineHeight: 1.2, marginBottom: 4 }}>{b.name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', color: 'var(--nx-muted)', textTransform: 'uppercase' }}>{b.industry} · {b.city}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Demo credentials */}
        <div style={{ padding: '24px 0 80px' }}>
          <div style={{ border: '1px solid #7a2a0c', background: 'linear-gradient(180deg,rgba(196,75,27,0.05),transparent)', padding: '28px 32px', display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center' }} className="nx-creds-wrap">
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>For the hackathon judge</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-fg)', lineHeight: 1.5 }}>
                Skip registration. Sign in as <strong style={{ color: 'var(--nx-fg-strong)' }}>Meridian Logistics</strong> to explore discovery, live sessions, AI-mediated intros and receipts with seeded data.
              </div>
            </div>
            <div style={{ display: 'flex', border: '1px solid var(--nx-border)' }} className="nx-creds-box">
              <div style={{ padding: '16px 22px', borderRight: '1px solid var(--nx-border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Email</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>admin@meridian.io</div>
              </div>
              <div style={{ padding: '16px 22px', borderRight: '1px solid var(--nx-border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Password</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg-strong)' }}>demo1234</div>
              </div>
              <Link href="/auth/login" style={{ padding: '16px 22px', background: '#c44b1b', display: 'flex', alignItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Enter →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--nx-border)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 40px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr', gap: 32, paddingBottom: 48, borderBottom: '1px solid var(--nx-line)' }} className="nx-footer-grid">
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
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--nx-muted)', maxWidth: 300 }}>
                The verified deal room for business. Discover identity-checked partners, open structured sessions, exchange receipts.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>Platform</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Discovery', 'Sessions', 'Receipts', 'Verification'].map(l => (
                  <span key={l} style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>Company</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['About', 'Careers', 'Contact', 'Press'].map(l => (
                  <span key={l} style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', cursor: 'pointer' }}>{l}</span>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>Trust</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Security', 'Privacy', 'Terms', 'Status'].map(l => (
                  <span key={l} style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', cursor: 'pointer' }}>{l}</span>
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
        @media (max-width: 768px) {
          .nx-stat-row { grid-template-columns: repeat(2,1fr) !important; }
          .nx-preview-grid { grid-template-columns: repeat(2,1fr) !important; }
          .nx-creds-wrap { grid-template-columns: 1fr !important; }
          .nx-creds-box { flex-wrap: wrap; }
          .nx-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .nx-stat-row { grid-template-columns: 1fr !important; }
          .nx-preview-grid { grid-template-columns: 1fr !important; }
          .nx-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
