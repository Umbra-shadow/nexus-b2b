'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2, Check } from 'lucide-react'

interface BusinessData {
  name: string
  description: string
  city: string
  website: string
  bank_account_name: string
  bank_account_number: string
  bank_name: string
  bank_swift: string
}

export default function BusinessSettingsPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<BusinessData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [ok, setOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/businesses/me')
      .then((r) => r.json())
      .then((j) => { setData(j.business); setLoading(false) })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!data) return
    setSaving(true); setError(null)
    const res = await fetch('/api/businesses/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setSaving(false)
    if (res.ok) { setOk(true); setTimeout(() => setOk(false), 3000) }
    else { const j = await res.json(); setError(j.error ?? 'Failed to save') }
  }

  const isAdmin = session?.user?.role === 'business_admin'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
    </div>
  )
  if (!data) return null

  const inputStyle = { background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', color: 'var(--nx-fg-strong)', fontFamily: 'var(--font-serif)', fontSize: 15, padding: '10px 14px', width: '100%', outline: 'none' }
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'var(--nx-muted)', display: 'block', marginBottom: 8 }

  return (
    <div style={{ padding: '28px 20px', maxWidth: 620, animation: 'nx-rise 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Settings</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>BUSINESS</h1>
      </div>

      {error && <div style={{ border: '1px solid #7a2a0c', background: 'rgba(196,75,27,0.08)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e07050', marginBottom: 20 }}>{error}</div>}
      {ok && <div style={{ border: '1px solid #2a5a3a', background: 'rgba(90,154,122,0.07)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}><Check size={12} /> Changes saved.</div>}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Company profile */}
        <div style={{ border: '1px solid var(--nx-border)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Company Profile</div>
          </div>
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>Business name</label>
              <input value={data.name} onChange={(e) => setData({ ...data, name: e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Description</label>
              <textarea rows={3} maxLength={500} value={data.description ?? ''} onChange={(e) => setData({ ...data, description: e.target.value })} placeholder="What does your company do?" style={{ ...inputStyle, resize: 'none', minHeight: 'unset' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>City</label>
                <input value={data.city ?? ''} onChange={(e) => setData({ ...data, city: e.target.value })} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Website</label>
                <input type="url" value={data.website ?? ''} onChange={(e) => setData({ ...data, website: e.target.value })} placeholder="https://" style={inputStyle} />
              </div>
            </div>
          </div>
        </div>

        {/* Banking details */}
        {isAdmin && (
          <div style={{ border: '1px solid var(--nx-border)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-muted)' }}>🔒</span>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Payment Details</div>
            </div>
            <div style={{ padding: '14px 24px', borderBottom: '1px solid var(--nx-border)', background: 'rgba(196,75,27,0.03)' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', lineHeight: 1.6 }}>
                Shown to counterparties when they receive a receipt from you. Stored encrypted.
              </p>
            </div>
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={labelStyle}>Account holder name</label>
                <input value={data.bank_account_name ?? ''} onChange={(e) => setData({ ...data, bank_account_name: e.target.value })} placeholder="Company Legal Name" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Account number / IBAN</label>
                <input value={data.bank_account_number ?? ''} onChange={(e) => setData({ ...data, bank_account_number: e.target.value })} placeholder="GB00 0000 0000 0000 0000 00" style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Bank name</label>
                  <input value={data.bank_name ?? ''} onChange={(e) => setData({ ...data, bank_name: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>SWIFT / BIC</label>
                  <input value={data.bank_swift ?? ''} onChange={(e) => setData({ ...data, bank_swift: e.target.value })} placeholder="XXXXGB00" style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: 13 }} />
                </div>
              </div>
            </div>
          </div>
        )}

        <button type="submit" disabled={saving} style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '14px 24px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
          {saving ? <Loader2 size={12} className="animate-spin" /> : ok ? <Check size={12} /> : null}
          Save Changes
        </button>
      </form>
    </div>
  )
}
