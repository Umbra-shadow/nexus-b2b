'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BusinessCard } from '@/components/business/BusinessCard'
import { INDUSTRIES } from '@/lib/validators'
import { COUNTRIES } from '@/lib/constants/countries'
import type { BusinessSearchResult } from '@/types/business'

export default function DiscoveryPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [country, setCountry] = useState('')
  const [industry, setIndustry] = useState('')
  const [results, setResults] = useState<BusinessSearchResult[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return

    startTransition(async () => {
      const params = new URLSearchParams({ q: query })
      if (country) params.set('country', country)
      if (industry) params.set('industry', industry)

      const res = await fetch(`/api/businesses?${params}`)
      const json = await res.json()
      setResults(json.businesses ?? [])
      setSearched(true)
    })
  }

  async function handleStartSession(businessId: string) {
    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverBusinessId: businessId, searchContext: query }),
    })
    const json = await res.json()
    if (res.ok) {
      router.push(`/sessions/${json.sessionId}`)
    }
  }

  return (
    <div className="container-app py-8 space-y-8">
      <div>
        <h1 className="text-heading text-foreground">Discovery</h1>
        <p className="text-muted-foreground mt-1">Find verified businesses worldwide</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="I'm looking for a company that deals with logistics in Germany…"
            className="pl-12 text-base min-h-[52px]"
            required
          />
        </div>

        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="input-base"
              aria-label="Filter by country"
            >
              <option value="">All countries</option>
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <select
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="input-base capitalize"
              aria-label="Filter by industry"
            >
              <option value="">All industries</option>
              {INDUSTRIES.map((ind) => (
                <option key={ind} value={ind} className="capitalize">{ind}</option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={isPending} className="gap-2 min-h-[44px]">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Search
          </Button>
        </div>
      </form>

      {/* Results */}
      {isPending && (
        <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Searching…
        </div>
      )}

      {!isPending && searched && results.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No businesses found. Try broadening your search.</p>
        </div>
      )}

      {!isPending && results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            {results.length} business{results.length !== 1 ? 'es' : ''} found
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((business) => (
              <BusinessCard
                key={business.id}
                business={business}
                onStartSession={handleStartSession}
              />
            ))}
          </div>
        </>
      )}

      {!searched && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
          <p>Search for businesses to get started.</p>
          <p className="text-sm mt-1">Try "healthcare supplier in France" or "technology partner"</p>
        </div>
      )}
    </div>
  )
}
