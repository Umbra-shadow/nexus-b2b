'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { BusinessCard } from '@/components/business/BusinessCard'
import type { BusinessSearchResult } from '@/types/business'

const INDUSTRY_CHIPS = [
  'All',
  'Manufacturing',
  'SaaS / IT',
  'Finance',
  'Food & Beverage',
  'Pharmaceuticals',
  'Packaging',
  'Metals',
  'Marketing',
  'Technology',
  'Logistics',
  'Healthcare',
  'Retail',
  'Energy',
  'Agriculture',
  'Legal',
]

const MAX_SERVICES = 3

export default function DiscoveryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [industry, setIndustry] = useState('All')
  const [results, setResults] = useState<BusinessSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [isPending, startTransition] = useTransition()

  // Service-selection modal state
  const [pendingBusiness, setPendingBusiness] = useState<BusinessSearchResult | null>(null)
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [starting, setStarting] = useState(false)

  function fetchBusinesses(q: string, ind: string) {
    startTransition(async () => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (ind && ind !== 'All') params.set('industry', ind.toLowerCase())
      const res = await fetch(`/api/businesses?${params}`)
      const json = await res.json()
      setResults(json.businesses ?? [])
      setTotal(json.businesses?.length ?? 0)
    })
  }

  useEffect(() => { fetchBusinesses('', 'All') }, [])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    fetchBusinesses(searchQuery, industry)
  }

  function setChip(chip: string) {
    setIndustry(chip)
    fetchBusinesses(searchQuery, chip)
  }

  function openServiceModal(businessId: string) {
    const biz = results.find((b) => b.id === businessId)
    if (!biz) return
    setSelectedServices([])
    setPendingBusiness(biz)
  }

  function toggleService(service: string) {
    setSelectedServices((prev) => {
      if (prev.includes(service)) return prev.filter((s) => s !== service)
      if (prev.length >= MAX_SERVICES) return prev
      return [...prev, service]
    })
  }

  async function confirmSession() {
    if (!pendingBusiness) return
    setStarting(true)
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverBusinessId: pendingBusiness.id,
        searchContext: searchQuery || undefined,
        selectedServices,
      }),
    })
    const json = await res.json()
    setStarting(false)
    setPendingBusiness(null)
    if (res.ok || (res.status === 409 && json.sessionId)) {
      router.push(`/sessions/${json.sessionId}`)
    }
  }

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Discovery</div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 8 }}>FIND VERIFIED PARTNERS</h1>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-muted)', marginBottom: 28, maxWidth: 560 }}>
        Search in plain language. Only verified businesses with public profiles appear here.
      </p>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid var(--nx-strong)', background: 'var(--nx-raised)', padding: '14px 18px' }}>
          <span style={{ color: '#c44b1b', fontSize: 15, flexShrink: 0 }}>⌕</span>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g. compostable packaging supplier in Spain"
            style={{
              flex: 1,
              background: 'none',
              border: 'none',
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              color: 'var(--nx-fg-strong)',
              outline: 'none',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '0 28px', cursor: 'pointer', border: 'none', flexShrink: 0 }}
        >
          {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
          ⌕ Search
        </button>
      </form>

      {/* Industry chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {INDUSTRY_CHIPS.map((chip) => {
          const active = industry === chip
          return (
            <button
              key={chip}
              onClick={() => setChip(chip)}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: active ? '#ffffff' : 'var(--nx-fg)',
                border: `1px solid ${active ? '#c44b1b' : 'var(--nx-strong)'}`,
                background: active ? '#c44b1b' : 'transparent',
                padding: '7px 13px',
                cursor: 'pointer',
              }}
            >
              {chip}
            </button>
          )
        })}
      </div>

      {/* Result count */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', borderBottom: '1px solid var(--nx-border)', paddingBottom: 12, marginBottom: 0 }}>
        {total} verified results
      </div>

      {/* Results grid */}
      {isPending ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 12, color: 'var(--nx-muted)' }}>
          <Loader2 size={18} className="animate-spin" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em' }}>Searching…</span>
        </div>
      ) : results.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-muted)' }}>No businesses found. Try a different search.</p>
        </div>
      ) : (
        <div className="nx-discovery-grid">
          {results.map((business) => (
            <BusinessCard key={business.id} business={business} onStartSession={openServiceModal} />
          ))}
        </div>
      )}

      {/* Service-selection modal */}
      {pendingBusiness && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,10,10,0.72)', zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setPendingBusiness(null) }}
        >
          <div style={{ background: 'var(--nx-bg)', border: '1px solid var(--nx-strong)', padding: '36px 32px', width: '100%', maxWidth: 480, position: 'relative' }}>

            {/* Close */}
            <button
              onClick={() => setPendingBusiness(null)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>

            {/* Header */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Start deal session</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 6 }}>{pendingBusiness.name}</h2>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', marginBottom: 24, lineHeight: 1.55 }}>
              Select up to {MAX_SERVICES} services you are interested in. Lummy will introduce both parties and reference your selection when the session opens.
            </p>

            {/* Services tick-boxes */}
            {(pendingBusiness.services ?? []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
                {(pendingBusiness.services ?? []).map((service) => {
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
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: checked ? 'var(--nx-fg-strong)' : 'var(--nx-fg)', lineHeight: 1.3 }}>
                        {service}
                      </span>
                    </label>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', marginBottom: 28 }}>
                This company has not listed specific services yet. You can still open a session.
              </p>
            )}

            {/* Selection count */}
            {selectedServices.length > 0 && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 16 }}>
                {selectedServices.length} of {MAX_SERVICES} selected
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setPendingBusiness(null)}
                style={{ border: '1px solid var(--nx-border)', background: 'none', color: 'var(--nx-fg)', padding: '11px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmSession}
                disabled={starting}
                style={{ flex: 1, background: '#c44b1b', color: '#ffffff', border: 'none', padding: '11px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: starting ? 'not-allowed' : 'pointer', opacity: starting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {starting ? <Loader2 size={12} className="animate-spin" /> : null}
                {starting ? 'Starting…' : 'Start session →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
