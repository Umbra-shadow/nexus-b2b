'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/admin', label: '◈ Overview', exact: true },
  { href: '/admin/businesses', label: '⬡ Businesses', exact: false },
  { href: '/admin/users', label: '◎ Users', exact: false },
  { href: '/admin/sessions', label: '⬢ Sessions', exact: false },
  { href: '/admin/receipts', label: '◻ Receipts', exact: false },
  { href: '/admin/settings', label: '⚙ Settings', exact: false },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav style={{ flex: 1, paddingTop: 8, paddingBottom: 8 }}>
      {NAV_ITEMS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'block',
              padding: '12px 20px',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              textDecoration: 'none',
              color: active ? '#c44b1b' : 'var(--nx-muted)',
              background: active ? 'rgba(196,75,27,0.12)' : 'transparent',
              borderLeft: active ? '2px solid #c44b1b' : '2px solid transparent',
              transition: 'color 0.15s, background 0.15s',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
