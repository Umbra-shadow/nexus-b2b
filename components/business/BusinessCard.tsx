import Link from 'next/link'
import { truncate } from '@/lib/utils'
import type { BusinessSearchResult } from '@/types/business'

interface BusinessCardProps {
  business: BusinessSearchResult
  onStartSession?: (businessId: string) => void
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

export function BusinessCard({ business, onStartSession }: BusinessCardProps) {
  return (
    <div style={{
      padding: 24,
      borderBottom: '1px solid var(--nx-border)',
      borderRight: '1px solid var(--nx-border)',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--nx-bg)',
      transition: 'background 0.15s',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{
          width: 44,
          height: 44,
          border: '1px solid var(--nx-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-display)',
          fontSize: 20,
          color: 'var(--nx-fg-strong)',
          flexShrink: 0,
          letterSpacing: '0.04em',
        }}>
          {getInitials(business.name)}
        </div>
        {business.verificationStatus === 'verified' && (
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 8,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#c44b1b',
            border: '1px solid #7a2a0c',
            padding: '3px 7px',
            flexShrink: 0,
          }}>
            ✓ Verified
          </span>
        )}
      </div>

      {/* Name + meta */}
      <div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-fg-strong)', lineHeight: 1.2, marginBottom: 6 }}>
          {business.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>
          {business.industry}
          {(business.city || business.country) && (
            <span> · {[business.city, business.country].filter(Boolean).join(', ')}</span>
          )}
        </div>
      </div>

      {/* Description */}
      {business.description && (
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.55, flex: 1 }}>
          {truncate(business.description, 130)}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTop: '1px solid var(--nx-line)', marginTop: 'auto' }}>
        {(business as { website?: string | null }).website ? (
          <a
            href={(business as { website?: string | null }).website!}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-subtle)', textDecoration: 'none', textTransform: 'uppercase' }}
          >
            ↗ Website
          </a>
        ) : (
          <span />
        )}
        {onStartSession && (
          <button
            onClick={() => onStartSession(business.id)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#ffffff',
              background: '#c44b1b',
              border: 'none',
              padding: '9px 16px',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Open session →
          </button>
        )}
      </div>
    </div>
  )
}
