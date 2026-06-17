'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DiscoverySearch() {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (q) router.push(`/discovery?q=${encodeURIComponent(q)}`)
    else router.push('/discovery')
  }

  return (
    <form onSubmit={handleSearch}>
      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--nx-strong)', background: 'var(--nx-bg)', marginBottom: 14 }}>
        <span style={{ color: 'var(--nx-subtle)', fontSize: 14, padding: '11px 12px', flexShrink: 0 }}>⌕</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. textile manufacturer in Portugal"
          style={{
            flex: 1,
            background: 'none',
            border: 'none',
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            color: 'var(--nx-fg-strong)',
            outline: 'none',
            padding: '11px 0',
          }}
        />
      </div>
      <button
        type="submit"
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'center',
          background: '#c44b1b',
          color: '#ffffff',
          padding: 11,
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          border: 'none',
        }}
      >
        Search network →
      </button>
    </form>
  )
}
