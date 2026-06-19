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
    <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--nx-border)', marginBottom: 32 }}>
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
              padding: '0 4px 14px',
              marginRight: 28,
              cursor: 'pointer',
              background: 'none',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              borderBottom: `2px solid ${active ? '#c44b1b' : 'transparent'}`,
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
    <div style={{ display: 'flex', minHeight: '100%' }}>
      {/* Form area — capped so the image always gets real estate */}
      <div style={{ flex: '0 0 auto', width: '100%', maxWidth: 780, padding: '36px 40px', overflowY: 'auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Settings</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 24 }}>SETTINGS</h1>
        <Suspense>
          <TabBar />
        </Suspense>
        {children}
      </div>

      {/* Decorative image panel — grows to fill all remaining width */}
      <div style={{
        flex: 1,
        minWidth: 200,
        borderLeft: '1px solid var(--nx-border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--nx-raised)',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/settings_pic.jpeg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    </div>
  )
}
