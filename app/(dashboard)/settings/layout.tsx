'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

const TABS = [
  { label: 'Account',        href: '/settings/account?tab=account' },
  { label: 'Business',       href: '/settings/account?tab=business' },
  { label: 'Billing',        href: '/settings/billing' },
  { label: 'Data & Exports', href: '/settings/data' },
  { label: 'Privacy Policy', href: '/settings/policies' },
  { label: 'Contact Us',     href: '/settings/contact' },
]

function TabBar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const tabParam = searchParams.get('tab')

  function isActive(href: string) {
    const [path, query] = href.split('?')
    if (path !== pathname) return false
    if (!query) return true
    const tab = new URLSearchParams(query).get('tab')
    return tab === tabParam || (!tabParam && tab === 'account')
  }

  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--nx-border)' }}>
      {TABS.map((t) => {
        const active = isActive(t.href)
        return (
          <button
            key={t.href}
            onClick={() => router.push(t.href)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: active ? 'var(--nx-fg-strong)' : 'var(--nx-muted)',
              padding: '0 4px 12px',
              marginRight: 24,
              cursor: 'pointer',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: `2px solid ${active ? '#c44b1b' : 'transparent'}`,
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ── Left column: fixed header + scrollable content ── */}
      <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 780, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>

        {/* Static header — never scrolls */}
        <div style={{ flexShrink: 0, padding: '28px 40px 0' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 8 }}>/ Settings</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 46, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 20 }}>SETTINGS</h1>
          <Suspense>
            <TabBar />
          </Suspense>
        </div>

        {/* Scrollable content — only this moves */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 40px 36px', minHeight: 0 }}>
          {children}
        </div>
      </div>

      {/* ── Right column: image, completely static ── */}
      <div style={{
        flex: 1,
        minWidth: 200,
        borderLeft: '1px solid var(--nx-border)',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--nx-raised)',
        flexShrink: 0,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings_pic.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>

    </div>
  )
}
