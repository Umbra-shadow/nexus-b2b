'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { AdminAIAssistant } from './AdminAIAssistant'

const LS_KEY = 'NEXUSB2B_GEMINI_KEY'

const CRUMBS: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/businesses': 'Businesses',
  '/admin/users': 'Users',
  '/admin/sessions': 'Sessions',
  '/admin/receipts': 'Receipts',
  '/admin/settings': 'Settings',
}

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
  const btn: React.CSSProperties = {
    fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em',
    textTransform: 'uppercase', border: '1px solid var(--nx-border)',
    background: 'none', padding: '5px 8px', cursor: 'pointer', flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, borderLeft: '1px solid var(--nx-border)', paddingLeft: 14 }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: hasKey ? '#5a9a7a' : '#c44b1b', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {hasKey ? '🔑 AI ✓' : '🔑 AI key'}
      </span>
      <input
        type={show ? 'text' : 'password'}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
        placeholder="AIza…"
        style={{ width: 120, background: 'var(--nx-raised)', border: `1px solid ${hasKey ? '#274a3a' : 'var(--nx-border)'}`, padding: '4px 7px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-fg-strong)', outline: 'none', letterSpacing: show ? '0.04em' : '0.2em' }}
      />
      <button onClick={() => setShow(s => !s)} style={{ ...btn, color: 'var(--nx-muted)' }}>{show ? 'Hide' : 'Show'}</button>
      <button onClick={handleSave} style={{ ...btn, background: saved ? '#274a3a' : 'none', color: saved ? '#5a9a7a' : '#c44b1b', borderColor: saved ? '#274a3a' : '#c44b1b' }}>{saved ? '✓' : 'Save'}</button>
      <button onClick={handleClear} disabled={!hasKey && !draft} style={{ ...btn, color: 'var(--nx-muted)', opacity: (!hasKey && !draft) ? 0.4 : 1 }}>Clear</button>
    </div>
  )
}

function SignOutButton() {
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 6, display: 'flex', alignItems: 'center', gap: 6 }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#c44b1b'; e.currentTarget.style.color = '#c44b1b' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--nx-border)'; e.currentTarget.style.color = 'var(--nx-muted)' }}
      >
        <span>⏻</span> Sign Out
      </button>

      {showConfirm && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{ background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '32px 28px', maxWidth: 360, width: '90%' }}
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
                style={{ flex: 1, padding: '11px 16px', background: '#c44b1b', border: 'none', color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Yes, Sign Out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                style={{ flex: 1, padding: '11px 16px', background: 'none', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer' }}
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

export function AdminTopBar() {
  const pathname = usePathname()
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

  const crumb = (() => {
    for (const [k, v] of Object.entries(CRUMBS)) {
      if (pathname === k || pathname.startsWith(k + '/')) return `/ System Admin / ${v}`
    }
    return '/ System Admin'
  })()

  const isDark = theme === 'dark'

  return (
    <header style={{ height: 64, borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-bg)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 24px', position: 'sticky', top: 0, zIndex: 5, flexShrink: 0 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', flexShrink: 0 }}>
        {crumb}
      </div>

      <div style={{ flex: 1 }} />

      <AdminAIAssistant />

      <GeminiKeyInput />

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 0, cursor: 'pointer', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: 0, lineHeight: 1, overflow: 'hidden', flexShrink: 0 }}
      >
        <span style={{ padding: '7px 9px', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', background: isDark ? '#c44b1b' : 'transparent', color: isDark ? '#fff' : 'var(--nx-muted)' }}>☾ Dark</span>
        <span style={{ width: 1, height: 24, background: 'var(--nx-border)', flexShrink: 0 }} />
        <span style={{ padding: '7px 9px', fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', background: !isDark ? '#c44b1b' : 'transparent', color: !isDark ? '#fff' : 'var(--nx-muted)' }}>☀ Light</span>
      </button>

      <SignOutButton />
    </header>
  )
}
