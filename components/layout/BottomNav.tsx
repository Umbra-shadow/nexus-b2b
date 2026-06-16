'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Home', glyph: '▦' },
  { href: '/discovery', label: 'Discover', glyph: '◎' },
  { href: '/sessions', label: 'Sessions', glyph: '◈' },
  { href: '/receipts', label: 'Receipts', glyph: '▤' },
  { href: '/settings/account', label: 'Settings', glyph: '◬' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="nx-sidebar"
      style={{ display: 'none' }}
    >
      {/* Hidden on desktop — mobile only via override below */}
      <style>{`
        @media (max-width: 1023px) {
          .nx-bottom-nav { display: flex !important; }
        }
      `}</style>
      <div className="nx-bottom-nav" style={{
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: 'var(--nx-raised)',
        borderTop: '1px solid var(--nx-border)',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '8px 8px',
      }}>
        {NAV_ITEMS.map(({ href, label, glyph }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                textDecoration: 'none',
                minWidth: 44,
              }}
            >
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: active ? '#c44b1b' : 'var(--nx-muted)' }}>{glyph}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: active ? '#c44b1b' : 'var(--nx-subtle)' }}>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
