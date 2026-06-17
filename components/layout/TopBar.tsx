'use client'

import { usePathname } from 'next/navigation'
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

const LS_KEY = 'NEXUSB2B_GEMINI_KEY'

function GeminiKeyInput() {
  const [key, setKey] = useState('')
  const [draft, setDraft] = useState('')
  const [show, setShow] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY) ?? ''
    setKey(stored)
    setDraft(stored)
  }, [])

  function handleSave() {
    const trimmed = draft.trim()
    localStorage.setItem(LS_KEY, trimmed)
    setKey(trimmed)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleClear() {
    localStorage.removeItem(LS_KEY)
    setKey('')
    setDraft('')
  }

  const hasKey = key.length > 0
  const btnBase: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    border: '1px solid var(--nx-border)',
    background: 'none',
    padding: '6px 10px',
    cursor: 'pointer',
    flexShrink: 0,
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, borderLeft: '1px solid var(--nx-border)', paddingLeft: 16 }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
        <span style={{ fontSize: 11 }}>🔑</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: hasKey ? '#5a9a7a' : '#c44b1b',
          whiteSpace: 'nowrap',
        }}>
          {hasKey ? 'Gemini ✓' : 'Gemini key'}
        </span>
      </div>

      {/* Key input */}
      <input
        type={show ? 'text' : 'password'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        placeholder="AIza…"
        style={{
          width: 140,
          background: 'var(--nx-raised)',
          border: `1px solid ${hasKey ? '#274a3a' : 'var(--nx-border)'}`,
          padding: '5px 8px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          color: 'var(--nx-fg-strong)',
          outline: 'none',
          letterSpacing: show ? '0.04em' : '0.2em',
        }}
      />

      {/* Show / Hide */}
      <button
        onClick={() => setShow((s) => !s)}
        title={show ? 'Hide key' : 'Show key'}
        style={{ ...btnBase, color: 'var(--nx-muted)' }}
      >
        {show ? 'Hide' : 'Show'}
      </button>

      {/* Save */}
      <button
        onClick={handleSave}
        style={{ ...btnBase, background: saved ? '#274a3a' : 'none', color: saved ? '#5a9a7a' : '#c44b1b', borderColor: saved ? '#274a3a' : '#c44b1b' }}
      >
        {saved ? 'Saved ✓' : 'Save'}
      </button>

      {/* Clear */}
      <button
        onClick={handleClear}
        disabled={!hasKey && !draft}
        style={{ ...btnBase, color: 'var(--nx-muted)', opacity: (!hasKey && !draft) ? 0.4 : 1 }}
      >
        Clear
      </button>
    </div>
  )
}

export function TopBar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [theme, setTheme] = useState('light')
  const [business, setBusiness] = useState<{ name: string; city: string; verification_status: string } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('nx-theme') || 'light'
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

  let crumb = ''
  const match = Object.entries(BREADCRUMBS).find(([k]) => pathname === k || pathname.startsWith(k + '/'))
  if (match) {
    crumb = '/ ' + match[1]
  } else if (pathname.startsWith('/sessions/')) {
    crumb = '/ Sessions / Live'
  } else if (pathname.startsWith('/receipts/')) {
    crumb = '/ Receipts / Detail'
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
      gap: 16,
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 5,
      flexShrink: 0,
    }}>
      {/* Breadcrumb */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', flexShrink: 0 }}>
        {crumb}
      </div>

      <div style={{ flex: 1 }} />

      {/* Gemini API key input */}
      <GeminiKeyInput />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 0, cursor: 'pointer', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: 0, lineHeight: 1, overflow: 'hidden', flexShrink: 0 }}
      >
        <span style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: isDark ? '#c44b1b' : 'transparent', color: isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s', whiteSpace: 'nowrap' }}>☾ Dark</span>
        <span style={{ width: 1, height: 28, background: 'var(--nx-border)', flexShrink: 0 }} />
        <span style={{ padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', background: !isDark ? '#c44b1b' : 'transparent', color: !isDark ? '#fff' : 'var(--nx-muted)', transition: 'background 0.2s, color 0.2s', whiteSpace: 'nowrap' }}>☀ Light</span>
      </button>

      {/* Business info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderLeft: '1px solid var(--nx-border)', paddingLeft: 16 }}>
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
