'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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

export default function DiscoveryPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [industry, setIndustry] = useState('All')
  const [results, setResults] = useState<BusinessSearchResult[]>([])
  const [total, setTotal] = useState(0)
  const [isPending, startTransition] = useTransition()

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

  async function handleStartSession(businessId: string) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverBusinessId: businessId, searchContext: searchQuery }),
    })
    const json = await res.json()
    if (res.status === 409 && json.sessionId) {
      router.push(`/sessions/${json.sessionId}`)
    } else if (res.ok) {
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
            <BusinessCard key={business.id} business={business} onStartSession={handleStartSession} />
          ))}
        </div>
      )}
    </div>
  )
}
