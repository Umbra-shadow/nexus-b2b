'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

export const NAV_MENUS = [
  {
    label: 'Platform',
    items: [
      { label: 'Discovery', href: '/platform/discovery', desc: 'Find verified partners' },
      { label: 'Sessions', href: '/platform/sessions', desc: 'Structured deal rooms' },
      { label: 'Receipts', href: '/platform/receipts', desc: 'Verified transaction records' },
      { label: 'Verification', href: '/platform/verification', desc: 'Identity trust process' },
    ],
  },
  {
    label: 'Company',
    items: [
      { label: 'About', href: '/about', desc: 'Our mission and story' },
      { label: 'Careers', href: '/careers', desc: 'Join the team' },
      { label: 'Contact', href: '/contact', desc: 'Get in touch' },
      { label: 'Press', href: '/press', desc: 'Media resources' },
    ],
  },
  {
    label: 'Trust',
    items: [
      { label: 'Security', href: '/security', desc: 'How we protect your data' },
      { label: 'Privacy', href: '/privacy', desc: 'Data handling policy' },
      { label: 'Terms', href: '/terms', desc: 'Terms of service' },
      { label: 'Status', href: '/status', desc: 'System uptime' },
    ],
  },
]

export function NavDropdown({
  label,
  items,
}: {
  label: string
  items: { label: string; href: string; desc: string }[]
}) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function enter() {
    if (timer.current) clearTimeout(timer.current)
    setOpen(true)
  }

  function leave() {
    timer.current = setTimeout(() => setOpen(false), 280)
  }

  return (
    <div style={{ position: 'relative' }} onMouseEnter={enter} onMouseLeave={leave}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'var(--nx-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '6px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        {label}
        <span style={{ fontSize: 7, opacity: 0.5 }}>▾</span>
      </button>

      {open && (
        /* Wrapper with paddingTop bridges the gap so mouse can travel to panel */
        <div
          onMouseEnter={enter}
          onMouseLeave={leave}
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            paddingTop: 8,
            zIndex: 200,
            minWidth: 220,
          }}
        >
          <div
            style={{
              background: 'var(--nx-raised)',
              border: '1px solid var(--nx-border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            }}
          >
            {items.map((item, i) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'block',
                  padding: '14px 20px',
                  borderBottom: i < items.length - 1 ? '1px solid var(--nx-line)' : undefined,
                  textDecoration: 'none',
                }}
              >
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', color: 'var(--nx-muted)', textTransform: 'uppercase' }}>
                  {item.desc}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
