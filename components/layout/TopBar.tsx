'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'

const BREADCRUMBS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/discovery': 'Discovery',
  '/sessions': 'Sessions',
  '/team': 'Team',
  '/receipts': 'Receipts',
  '/settings/business': 'Settings / Business',
  '/settings/account': 'Settings / Account',
  '/settings/policies': 'Settings / Policies',
  '/settings/contact': 'Settings / Contact',
}

export function TopBar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [theme, setTheme] = useState('dark')
  const [business, setBusiness] = useState<{ name: string; city: string; verification_status: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('nx-theme') || 'dark'
    setTheme(saved)
    document.documentElement.setAttribute('data-theme', saved)
  }, [])

  useEffect(() => {
    fetch('/api/businesses/me')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.business) setBusiness(j.business) })
      .catch(() => {})
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nx-theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const isDark = theme === 'dark'

  // Build breadcrumb text — format: / SectionName
  let crumb = ''
  const match = Object.entries(BREADCRUMBS).find(([k]) => pathname === k || pathname.startsWith(k + '/'))
  if (match) {
    crumb = '/ ' + match[1]
  } else if (pathname.startsWith('/sessions/')) {
    crumb = '/ Sessions / Live'
  } else if (pathname.startsWith('/receipts/')) {
    crumb = '/ Receipts / Detail'
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (search.trim()) {
      router.push(`/discovery?q=${encodeURIComponent(search.trim())}`)
    }
  }

  const bizName = business?.name ?? (session?.user as { businessName?: string })?.businessName ?? 'Your Business'
  const bizCity = business?.city ?? ''
  const isVerified = business?.verification_status === 'verified'

  return (
    <header style={{
      height: 64,
      borderBottom: '1px solid var(--nx-border)',
      background: 'var(--nx-bg)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      gap: 20,
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 5,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', flexShrink: 0 }}>
        {crumb}
      </div>

      {/* Search — centered */}
      <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 420, marginLeft: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: '9px 14px' }}>
          <span style={{ color: 'var(--nx-subtle)', fontSize: 12, flexShrink: 0 }}>⌕</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search verified businesses, plain language…"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-serif)',
              fontSize: 14,
              color: 'var(--nx-fg-strong)',
              outline: 'none',
            }}
          />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', border: '1px solid var(--nx-strong)', padding: '2px 5px', flexShrink: 0 }}>⌘K</span>
        </div>
      </form>

      {/* Theme toggle — pill switch */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 0, cursor: 'pointer', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: 0, lineHeight: 1, overflow: 'hidden', flexShrink: 0 }}
      >
        <span style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: isDark ? '#c44b1b' : 'transparent', color: isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s', whiteSpace: 'nowrap' }}>☾ Dark</span>
        <span style={{ width: 1, height: 28, background: 'var(--nx-border)', flexShrink: 0 }} />
        <span style={{ padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: !isDark ? '#c44b1b' : 'transparent', color: !isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s', whiteSpace: 'nowrap' }}>☀ Light</span>
      </button>

      {/* Business info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--nx-border)', paddingLeft: 20 }}>
        {isVerified && <div style={{ width: 7, height: 7, background: '#5a9a7a', borderRadius: 9999 }} />}
        <div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg-strong)', lineHeight: 1 }}>{bizName}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', color: 'var(--nx-muted)', marginTop: 2 }}>
            {isVerified ? 'VERIFIED' : 'PENDING'}{bizCity ? ` · ${bizCity.toUpperCase()}` : ''}
          </div>
        </div>
      </div>
    </header>
  )
}
