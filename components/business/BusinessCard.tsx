'use client'

import { useState } from 'react'
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
  const [expanded, setExpanded] = useState(false)
  const services = business.services ?? []

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

      {/* Services toggle */}
      {services.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--nx-muted)',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color: '#c44b1b' }}>{expanded ? '▾' : '▸'}</span>
            {expanded ? 'Hide services' : `${services.length} services offered`}
          </button>
          {expanded && (
            <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {services.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 8,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--nx-fg)',
                    border: '1px solid var(--nx-strong)',
                    padding: '4px 8px',
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingTop: 12, borderTop: '1px solid var(--nx-line)', marginTop: 'auto' }}>
        {business.website ? (
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-subtle)', textDecoration: 'none', textTransform: 'uppercase' }}
          >
            ↗ {business.website.replace(/^https?:\/\/(www\.)?/, '')}
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
