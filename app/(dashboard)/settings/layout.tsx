'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'

const TABS = [
  { label: 'Account',        href: '/settings/account?tab=account' },
  { label: 'Business',       href: '/settings/account?tab=business' },
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

const SETTINGS_IMAGE = process.env.NEXT_PUBLIC_SETTINGS_IMAGE_URL ?? ''

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'auto' }}>
      {/* Form area */}
      <div style={{ flex: 1, minWidth: 0, padding: '36px 40px', maxWidth: 780 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Settings</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 24 }}>SETTINGS</h1>
        <Suspense>
          <TabBar />
        </Suspense>
        {children}
      </div>

      {/* Decorative image panel */}
      <div style={{
        width: 260,
        flexShrink: 0,
        borderLeft: '1px solid var(--nx-border)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--nx-raised)',
      }}>
        {SETTINGS_IMAGE ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={SETTINGS_IMAGE} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 20 }}>
            {/* NexusB2B logo mark */}
            <div style={{ width: 48, height: 48, position: 'relative', flexShrink: 0 }}>
              <div style={{ position: 'absolute', width: 16, height: 16, background: '#c44b1b', top: 0, left: 0 }} />
              <div style={{ position: 'absolute', width: 16, height: 16, border: '2px solid #c44b1b', top: 0, right: 0 }} />
              <div style={{ position: 'absolute', width: 16, height: 16, border: '2px solid #c44b1b', bottom: 0, left: 0 }} />
              <div style={{ position: 'absolute', width: 16, height: 16, background: '#c44b1b', bottom: 0, right: 0 }} />
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', textAlign: 'center' }}>
              NexusB2B
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
