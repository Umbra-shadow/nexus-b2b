'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, MapPin, MessageSquare, Loader2 } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { IndustryBadge } from '@/components/shared/IndustryBadge'
import { VerifiedBadge } from '@/components/shared/VerifiedBadge'
import { Button } from '@/components/ui/button'
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
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverBusinessId: business.id,
        selectedServices,
      }),
    })
    const json = await res.json()
    if (res.ok) {
      router.push(`/sessions/${json.sessionId}`)
    } else if (res.status === 409 && json.sessionId) {
      router.push(`/sessions/${json.sessionId}`)
    } else {
      setStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div className="container-app py-20 text-center">
        <p className="text-muted-foreground mb-4">Business not found or not yet verified.</p>
        <Link href="/discovery">
          <Button variant="outline">Back to Discovery</Button>
        </Link>
      </div>
    )
  }

  const services = business.services ?? []

  return (
    <div className="container-app py-8 max-w-3xl space-y-6">
      <Link
        href="/discovery"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Discovery
      </Link>

      <div className="card-base space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <Avatar name={business.name} src={business.logoUrl} size="lg" />
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold text-foreground">{business.name}</h1>
              {business.verificationStatus === 'verified' && <VerifiedBadge size="md" />}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <IndustryBadge industry={business.industry} />
              {(business.city || business.country) && (
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" aria-hidden />
                  {[business.city, business.country].filter(Boolean).join(', ')}
                </span>
              )}
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-brand-brown hover:underline"
                >
                  <Globe className="w-3.5 h-3.5" aria-hidden />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">About</h2>
            <p className="text-foreground leading-relaxed">{business.description}</p>
          </div>
        )}

        {/* Services display */}
        {services.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Services offered</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {services.map((s) => (
                <span key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-fg)', border: '1px solid var(--nx-strong)', padding: '5px 10px' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="border-t border-border pt-5">
          {existingSessionId ? (
            <div className="flex items-center gap-3">
              <Link href={`/sessions/${existingSessionId}`}>
                <Button className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  View Active Session
                </Button>
              </Link>
              <p className="text-sm text-muted-foreground">You already have an open session with this business.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Service tick-boxes */}
              {services.length > 0 && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 12 }}>
                    Select up to {MAX_SERVICES} services you want to discuss
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {services.map((service) => {
                      const checked = selectedServices.includes(service)
                      const disabled = !checked && selectedServices.length >= MAX_SERVICES
                      return (
                        <label
                          key={service}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            padding: '10px 14px',
                            border: `1px solid ${checked ? '#c44b1b' : 'var(--nx-border)'}`,
                            background: checked ? 'rgba(196,75,27,0.06)' : 'transparent',
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            opacity: disabled ? 0.45 : 1,
                            transition: 'border-color 0.12s, background 0.12s',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={disabled}
                            onChange={() => toggleService(service)}
                            style={{ accentColor: '#c44b1b', width: 14, height: 14, flexShrink: 0 }}
                          />
                          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: checked ? 'var(--nx-fg-strong)' : 'var(--nx-fg)' }}>
                            {service}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                  {selectedServices.length > 0 && (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c44b1b', marginTop: 10 }}>
                      {selectedServices.length} of {MAX_SERVICES} selected
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                <Button onClick={handleStartSession} disabled={starting} className="gap-2">
                  {starting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Start Deal Session
                </Button>
                <p className="text-sm text-muted-foreground">
                  {services.length > 0 && selectedServices.length === 0
                    ? 'Select services above, then start your session.'
                    : 'Lummy will introduce both parties the moment you connect.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
