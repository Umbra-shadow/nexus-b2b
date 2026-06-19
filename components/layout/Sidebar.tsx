'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import { useSession } from 'next-auth/react'

function NxLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ width: 22, height: 22, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 7, height: 7, background: '#c44b1b', top: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 7, height: 7, border: '1px solid #c44b1b', top: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 7, height: 7, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 7, height: 7, background: '#c44b1b', bottom: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 15, background: 'var(--nx-faint)', left: '50%', top: 3 }} />
        <div style={{ position: 'absolute', height: 1, width: 15, background: 'var(--nx-faint)', top: '50%', left: 3 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
        NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
      </span>
    </div>
  )
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', glyph: '▦', key: 'dashboard' },
  { href: '/discovery', label: 'Discovery', glyph: '⌕', key: 'discovery' },
  { href: '/sessions', label: 'Sessions', glyph: '◇', key: 'sessions' },
  { href: '/receipts', label: 'Receipts', glyph: '▤', key: 'receipts' },
  { href: '/team', label: 'Team', glyph: '◎', key: 'team' },
  { href: '/settings/account', label: 'Settings', glyph: '⚙', key: 'settings' },
]

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [theme, setTheme] = useState('dark')
  const [pendingCount, setPendingCount] = useState(0)
  const [unackCount, setUnackCount] = useState(0)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('nx-theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  // Poll for pending badge counts
  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch('/api/sessions/counts')
        if (res.ok) {
          const json = await res.json()
          setPendingCount(json.pending ?? 0)
          setUnackCount(json.unacknowledged ?? 0)
        }
      } catch {
        // silently ignore
      }
    }
    fetchCounts()
    const iv = setInterval(fetchCounts, 30000)
    return () => clearInterval(iv)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nx-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const themeGlyph = theme === 'dark' ? '☀' : '☾'
  const themeLabel = theme === 'dark' ? 'Light' : 'Dark'

  const userName = session?.user?.name ?? 'User'
  const userRole = (session?.user as { role?: string })?.role ?? 'business_agent'
  const roleLabel = userRole === 'business_admin' ? 'Business Admin' : userRole === 'platform_admin' ? 'Platform Admin' : 'Business Agent'

  const badges: Record<string, number> = {
    sessions: pendingCount,
    receipts: unackCount,
  }

  return (
    <>
      <aside
        className="nx-sidebar"
        style={{
          width: 248,
          background: 'var(--nx-bg)',
          borderRight: '1px solid var(--nx-border)',
          flexDirection: 'column',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        {/* Logo header */}
        <Link href="/dashboard" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', height: 64, padding: '0 24px', borderBottom: '1px solid var(--nx-border)' }}>
          <NxLogo />
        </Link>

        {/* Nav */}
        <div style={{ flex: 1, padding: '20px 0', overflowY: 'auto' }}>
          {NAV_ITEMS.map(({ href, label, glyph, key }) => {
            const active = pathname === href || (key === 'sessions' && pathname.startsWith('/sessions')) || (key === 'receipts' && pathname.startsWith('/receipts')) || (key === 'settings' && pathname.startsWith('/settings'))
            const badge = badges[key] ?? 0
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '11px 24px',
                  textDecoration: 'none',
                  borderLeft: `2px solid ${active ? '#c44b1b' : 'transparent'}`,
                  background: active ? 'rgba(196,75,27,0.06)' : 'none',
                  color: active ? 'var(--nx-fg-strong)' : 'var(--nx-muted)',
                }}
              >
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, width: 16, color: active ? 'var(--nx-fg-strong)' : 'var(--nx-muted)', flexShrink: 0 }}>{glyph}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', flex: 1 }}>{label}</span>
                {badge > 0 && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', background: 'rgba(196,75,27,0.12)', padding: '2px 6px' }}>{badge}</span>
                )}
              </Link>
            )
          })}
        </div>

        {/* Bottom: appearance + user */}
        <div style={{ borderTop: '1px solid var(--nx-border)', padding: '14px 24px 16px' }}>
          {/* Appearance toggle */}
          <button
            onClick={toggleTheme}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', border: '1px solid var(--nx-border)', padding: '9px 12px', marginBottom: 14, cursor: 'pointer', background: 'none' }}
          >
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Appearance</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b' }}>{themeGlyph} {themeLabel}</span>
          </button>

          {/* User row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 15, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
              {getInitials(userName)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b' }}>{roleLabel}</div>
            </div>
          </div>

          {/* Sign out button — visible and labeled */}
          <button
            onClick={() => setShowSignOutConfirm(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              width: '100%',
              padding: '10px 12px',
              border: '1px solid var(--nx-border)',
              background: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--nx-muted)',
              transition: 'border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c44b1b'
              e.currentTarget.style.color = '#c44b1b'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--nx-border)'
              e.currentTarget.style.color = 'var(--nx-muted)'
            }}
          >
            <span style={{ fontSize: 13 }}>⏻</span>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Sign-out confirmation dialog */}
      {showSignOutConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)',
          }}
          onClick={() => setShowSignOutConfirm(false)}
        >
          <div
            style={{
              background: 'var(--nx-bg)',
              border: '1px solid var(--nx-border)',
              padding: '32px 28px',
              maxWidth: 360,
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 12 }}>/ Confirm</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--nx-fg-strong)', marginBottom: 10, textTransform: 'uppercase' }}>Sign Out?</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.6, color: 'var(--nx-muted)', marginBottom: 24 }}>
              You will be signed out of your account and returned to the login page.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: '#c44b1b',
                  border: 'none',
                  color: '#fff',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Yes, Sign Out
              </button>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                style={{
                  flex: 1,
                  padding: '11px 16px',
                  background: 'none',
                  border: '1px solid var(--nx-border)',
                  color: 'var(--nx-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
