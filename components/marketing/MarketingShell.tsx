'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { NavDropdown, NAV_MENUS } from './NavDropdowns'

export const PLATFORM_LINKS = [
  { label: 'Discovery', href: '/platform/discovery' },
  { label: 'Sessions', href: '/platform/sessions' },
  { label: 'Receipts', href: '/platform/receipts' },
  { label: 'Verification', href: '/platform/verification' },
]

export const COMPANY_LINKS = [
  { label: 'About', href: '/about' },
  { label: 'Careers', href: '/careers' },
  { label: 'Contact', href: '/contact' },
  { label: 'Press', href: '/press' },
]

export const TRUST_LINKS = [
  { label: 'Security', href: '/security' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Status', href: '/status' },
]

export const SUPPORT_LINKS = [
  { label: 'Help Center', href: '/help' },
  { label: 'Support', href: '/support' },
  { label: 'Contact', href: '/contact' },
]

function NxMark({ size = 22 }: { size?: number }) {
  const dot = Math.round(size * 0.32)
  return (
    <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: dot, height: dot, background: '#c44b1b', top: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: dot, height: dot, border: '1px solid #c44b1b', top: 0, right: 0 }} />
      <div style={{ position: 'absolute', width: dot, height: dot, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: dot, height: dot, background: '#c44b1b', bottom: 0, right: 0 }} />
    </div>
  )
}

export function useNxTheme(): [string, () => void] {
  const [theme, setTheme] = useState('light')
  useEffect(() => {
    const saved = localStorage.getItem('nx-theme') || 'light'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])
  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nx-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }
  return [theme, toggle]
}

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [theme, toggleTheme] = useNxTheme()
  const themeGlyph = theme === 'dark' ? '○' : '●'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60, borderBottom: '1px solid var(--nx-border)', gap: 16 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
            <NxMark size={26} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
              NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
            </span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
            <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', textDecoration: 'none' }}>Home</Link>
            {NAV_MENUS.map((m) => (
              <NavDropdown key={m.label} label={m.label} items={m.items} />
            ))}
            <button onClick={toggleTheme} title="Toggle theme" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-muted)', border: '1px solid var(--nx-border)', padding: '6px 10px', background: 'none', cursor: 'pointer', lineHeight: 1 }}>
              {themeGlyph}
            </button>
            <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg)', textDecoration: 'none' }}>Log in</Link>
            <Link href="/auth/register" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '10px 18px', textDecoration: 'none' }}>Register →</Link>
          </div>
        </nav>
      </div>

      {/* Page content */}
      <div style={{ flex: 1 }}>{children}</div>

      {/* Footer */}
      <MarketingFooter theme={theme} toggleTheme={toggleTheme} />
    </div>
  )
}

export function MarketingFooter({ theme, toggleTheme }: { theme: string; toggleTheme: () => void }) {
  const themeGlyph = theme === 'dark' ? '○' : '●'
  const columns: { title: string; links: { label: string; href: string }[] }[] = [
    { title: 'Platform', links: PLATFORM_LINKS },
    { title: 'Company', links: COMPANY_LINKS },
    { title: 'Support', links: SUPPORT_LINKS },
    { title: 'Trust', links: TRUST_LINKS },
  ]
  return (
    <div style={{ borderTop: '1px solid var(--nx-border)' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 32, paddingBottom: 48, borderBottom: '1px solid var(--nx-line)' }} className="nx-footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
              <NxMark size={22} />
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>NEXUS<span style={{ color: '#c44b1b' }}>B2B</span></span>
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--nx-muted)', maxWidth: 300 }}>
              The verified deal room for business. Discover identity-checked partners, open structured sessions, exchange receipts.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 18 }}>{col.title}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {col.links.map((l) => (
                  <Link key={l.label} href={l.href} className="nx-footer-link" style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', textDecoration: 'none' }}>{l.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-subtle)' }}>© 2026 NexusB2B</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a240', border: '1px solid #4a4020', padding: '4px 9px' }}>Demo build — fictional businesses</span>
          </div>
          <button onClick={toggleTheme} style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-muted)', border: '1px solid var(--nx-border)', padding: '6px 10px', background: 'none', cursor: 'pointer' }}>
            {themeGlyph} {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
      </div>
      <style>{`
        .nx-footer-link:hover { color: #c44b1b !important; }
        @media (max-width: 768px) { .nx-footer-grid { grid-template-columns: 1fr 1fr !important; } }
        @media (max-width: 480px) { .nx-footer-grid { grid-template-columns: 1fr !important; } }
      `}</style>
    </div>
  )
}
