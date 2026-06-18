'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Business } from '@/types/business'

const MAX_SERVICES = 3

export default function BusinessProfilePage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [existingSessionId, setExistingSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [notFound, setNotFound] = useState(false)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [startError, setStartError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/businesses/${slug}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); return null }
        return r.json()
      })
      .then((json) => {
        if (json) {
          setBusiness(json.business)
          setExistingSessionId(json.existingSessionId)
        }
        setLoading(false)
      })
  }, [slug])

  function toggleService(service: string) {
    setSelectedServices((prev) => {
      if (prev.includes(service)) return prev.filter((s) => s !== service)
      if (prev.length >= MAX_SERVICES) return prev
      return [...prev, service]
    })
  }

  async function handleStartSession() {
    if (!business) return
    setStarting(true)
    setStartError(null)
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverBusinessId: business.id, selectedServices }),
      })
      const json = await res.json()
      if (res.ok) {
        router.push(`/sessions/${json.sessionId}`)
      } else if (res.status === 409 && json.sessionId) {
        router.push(`/sessions/${json.sessionId}`)
      } else {
        setStartError(json.error ?? 'Could not start session. Please try again.')
        setStarting(false)
      }
    } catch {
      setStartError('Network error. Please check your connection and try again.')
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--nx-border)', borderTopColor: '#c44b1b', borderRadius: 9999, animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', marginBottom: 20 }}>Business not found or not yet verified.</p>
        <Link href="/discovery" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', textDecoration: 'none' }}>
          ← Back to Discovery
        </Link>
      </div>
    )
  }

  const services = business.services ?? []
  const initials = business.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div style={{ padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      {/* Breadcrumb */}
      <Link
        href="/discovery"
        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', textDecoration: 'none' }}
      >
        ← Discovery
      </Link>

      {/* Main horizontal card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--nx-border)', background: 'var(--nx-panel)', minHeight: 0 }}>

        {/* LEFT — business info */}
        <div style={{ padding: '28px 28px', borderRight: '1px solid var(--nx-border)', display: 'flex', flexDirection: 'column', gap: 20, overflow: 'auto' }}>
          {/* Avatar + name */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <div style={{ width: 52, height: 52, border: '1px solid var(--nx-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--nx-fg-strong)', flexShrink: 0, background: business.logoUrl ? undefined : 'var(--nx-raised)' }}>
              {business.logoUrl
                ? <img src={business.logoUrl} alt={business.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : initials
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 0.95, color: 'var(--nx-fg-strong)', textTransform: 'uppercase' }}>{business.name}</h1>
                {business.verificationStatus === 'verified' && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(90,154,122,0.4)', color: '#5a9a7a' }}>✓ Verified</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)' }}>{business.industry}</span>
                {(business.city || business.country) && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', letterSpacing: '0.06em' }}>
                    {[business.city, business.country].filter(Boolean).join(', ')}
                  </span>
                )}
                {business.website && (
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', textDecoration: 'none', letterSpacing: '0.06em' }}
                  >
                    ↗ Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {business.description && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>About</div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', lineHeight: 1.6 }}>{business.description}</p>
            </div>
          )}

          {/* Services (display-only on left) */}
          {services.length > 0 && (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>Services offered</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {services.map((s: string) => (
                  <span key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', border: '1px solid var(--nx-border)', color: 'var(--nx-fg)' }}>{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — action panel */}
        <div style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 20, justifyContent: 'space-between' }}>
          {existingSessionId ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center', flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Active session</div>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)' }}>You already have an open session with this business.</p>
              <Link
                href={`/sessions/${existingSessionId}`}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '13px 22px', background: '#c44b1b', color: '#fff', textDecoration: 'none', display: 'inline-block', alignSelf: 'flex-start' }}
              >
                Open Session →
              </Link>
            </div>
          ) : (
            <>
              {/* Service selection */}
              {services.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 10 }}>
                    Select up to {MAX_SERVICES} services to discuss
                    {selectedServices.length > 0 && (
                      <span style={{ color: '#c44b1b', marginLeft: 8 }}>({selectedServices.length} selected)</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {services.map((service: string) => {
                      const checked = selectedServices.includes(service)
                      const disabled = !checked && selectedServices.length >= MAX_SERVICES
                      return (
                        <button
                          key={service}
                          onClick={() => !disabled && toggleService(service)}
                          style={{
                            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase',
                            padding: '7px 12px', border: `1px solid ${checked ? '#c44b1b' : 'var(--nx-border)'}`,
                            background: checked ? 'rgba(196,75,27,0.08)' : 'transparent',
                            color: checked ? '#c44b1b' : disabled ? 'var(--nx-subtle)' : 'var(--nx-fg)',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.45 : 1,
                            transition: 'border-color 0.1s, background 0.1s',
                          }}
                        >
                          {checked ? '✓ ' : ''}{service}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* CTA + hint */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleStartSession}
                  disabled={starting}
                  style={{
                    fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                    padding: '14px 26px', border: 'none',
                    background: starting ? 'rgba(196,75,27,0.6)' : '#c44b1b',
                    color: '#fff', cursor: starting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                  }}
                >
                  {starting ? (
                    <><span style={{ width: 12, height: 12, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: 9999, animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Sending invitation…</>
                  ) : (
                    'Start Deal Session →'
                  )}
                </button>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)' }}>
                  {services.length > 0 && selectedServices.length === 0
                    ? 'Optionally select services above, then start your session.'
                    : 'An invitation email will be sent to their business contact.'}
                </p>
                {startError && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', border: '1px solid rgba(196,75,27,0.4)', padding: '10px 14px', letterSpacing: '0.04em' }}>
                    ✕ {startError}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
