'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// ── Shared style tokens (match NexusB2B.dc.html exactly) ─────────────────────

const L: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--nx-muted)',
  display: 'block',
  marginBottom: 10,
}

const I: React.CSSProperties = {
  width: '100%',
  background: 'var(--nx-raised)',
  border: '1px solid var(--nx-border)',
  padding: '14px 16px',
  fontFamily: 'var(--font-serif)',
  fontSize: 15,
  color: 'var(--nx-fg-strong)',
  outline: 'none',
}

const IM: React.CSSProperties = {
  ...I,
  fontFamily: 'var(--font-mono)',
  fontSize: 13,
}

const IR: React.CSSProperties = {
  ...IM,
  background: 'var(--nx-bg)',
  border: '1px solid var(--nx-line)',
  color: 'var(--nx-muted)',
}

const SH: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--nx-fg)',
  marginBottom: 20,
}

function SaveBtn({ saving, label }: { saving: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      style={{
        display: 'inline-block',
        background: saving ? 'var(--nx-muted)' : '#c44b1b',
        color: '#ffffff',
        padding: '14px 28px',
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        letterSpacing: '0.16em',
        textTransform: 'uppercase',
        cursor: saving ? 'not-allowed' : 'pointer',
        border: 'none',
        opacity: saving ? 0.7 : 1,
      }}
    >
      {saving ? 'Saving…' : label}
    </button>
  )
}

function Msg({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div style={{
      marginBottom: 24,
      fontFamily: 'var(--font-mono)',
      fontSize: 11,
      color: ok ? '#5a9a7a' : '#c44b1b',
      border: `1px solid ${ok ? '#274a3a' : '#7a2a0c'}`,
      padding: '10px 16px',
    }}>
      {text}
    </div>
  )
}

// ── Account tab ───────────────────────────────────────────────────────────────

function AccountTab() {
  const { data: session, update } = useSession()
  const [name, setName] = useState(session?.user?.name ?? '')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [phone, setPhone] = useState('')
  const [linkedin, setLinkedin] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name)
    fetch('/api/account').then(r => r.ok ? r.json() : null).then(j => {
      if (!j?.user) return
      setPhone(j.user.phone ?? '')
      setLinkedin(j.user.linkedin_url ?? '')
      setWhatsapp(j.user.whatsapp ?? '')
    })
  }, [session])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)

    if (newPw && newPw !== confirmPw) { setMsg({ ok: false, text: 'Passwords do not match.' }); return }
    if (newPw && newPw.length < 12) { setMsg({ ok: false, text: 'Password must be at least 12 characters.' }); return }

    setSaving(true)
    try {
      const r = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, linkedin_url: linkedin, whatsapp }),
      })
      if (!r.ok) { const j = await r.json(); setMsg({ ok: false, text: j.error ?? 'Failed to save.' }); return }
      await update({ name })

      if (newPw) {
        const r2 = await fetch('/api/account/password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentPassword: '', newPassword: newPw }),
        })
        if (!r2.ok) { const j = await r2.json(); setMsg({ ok: false, text: j.error ?? 'Password update failed.' }); return }
        setNewPw(''); setConfirmPw('')
      }

      setMsg({ ok: true, text: 'Changes saved.' })
      setTimeout(() => setMsg(null), 3000)
    } finally { setSaving(false) }
  }

  return (
    <form onSubmit={handleSave}>
      {msg && <Msg ok={msg.ok} text={msg.text} />}

      <div style={SH}>Profile</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div>
          <label style={L}>Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={I} required />
        </div>
        <div>
          <label style={L}>Email</label>
          <input value={session?.user?.email ?? ''} readOnly style={IR} />
        </div>
      </div>

      <div style={SH}>Contact info</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
        <div>
          <label style={L}>Phone / WhatsApp</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 000 0000" style={IM} />
        </div>
        <div>
          <label style={L}>WhatsApp (if different)</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+1 555 000 0000" style={IM} />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={L}>LinkedIn profile URL</label>
          <input value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/yourname" style={IM} />
        </div>
      </div>

      <div style={SH}>Change password</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        <div>
          <label style={L}>New password</label>
          <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="••••••••" style={IM} />
        </div>
        <div>
          <label style={L}>Confirm</label>
          <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="••••••••" style={IM} />
        </div>
      </div>

      <SaveBtn saving={saving} label="Save changes" />
    </form>
  )
}

// ── Business tab ──────────────────────────────────────────────────────────────

interface BizData {
  name: string
  city: string
  website: string
  industry: string
  description: string
  bank_account_name: string
  bank_name: string
  bank_account_number: string
  bank_swift: string
}

function BusinessTab() {
  const { data: session } = useSession()
  const [biz, setBiz] = useState<BizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/businesses/me')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.business) setBiz(j.business); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!biz) return
    setSaving(true); setMsg(null)
    const res = await fetch('/api/businesses/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: biz.name,
        city: biz.city,
        website: biz.website,
        industry: biz.industry,
        description: biz.description,
        bankAccountName: biz.bank_account_name,
        bankName: biz.bank_name,
        bankAccountNumber: biz.bank_account_number,
        bankSwift: biz.bank_swift,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setMsg({ ok: true, text: 'Business profile saved.' })
      setTimeout(() => setMsg(null), 3000)
    } else {
      const j = await res.json()
      setMsg({ ok: false, text: j.error ?? 'Failed to save.' })
    }
  }

  const isAdmin = session?.user?.role === 'business_admin'

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
    </div>
  )
  if (!biz) return null

  return (
    <form onSubmit={handleSave}>
      {msg && <Msg ok={msg.ok} text={msg.text} />}

      <div style={SH}>Company profile</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <div>
          <label style={L}>Company name</label>
          <input value={biz.name ?? ''} onChange={(e) => setBiz({ ...biz, name: e.target.value })} style={I} />
        </div>
        <div>
          <label style={L}>City</label>
          <input value={biz.city ?? ''} onChange={(e) => setBiz({ ...biz, city: e.target.value })} style={I} />
        </div>
        <div>
          <label style={L}>Website</label>
          <input value={biz.website ?? ''} onChange={(e) => setBiz({ ...biz, website: e.target.value })} placeholder="https://" style={I} />
        </div>
        <div>
          <label style={L}>Industry</label>
          <input value={biz.industry ?? ''} onChange={(e) => setBiz({ ...biz, industry: e.target.value })} style={I} />
        </div>
      </div>
      <div style={{ marginBottom: 40 }}>
        <label style={L}>Description</label>
        <textarea
          value={biz.description ?? ''}
          onChange={(e) => setBiz({ ...biz, description: e.target.value })}
          maxLength={500}
          style={{ ...I, minHeight: 84, resize: 'vertical' }}
        />
      </div>

      {isAdmin && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 0 }}>Payment details</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5a9a7a', border: '1px solid #274a3a', padding: '2px 6px' }}>
              🔒 Encrypted at rest
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
            <div>
              <label style={L}>Account holder</label>
              <input value={biz.bank_account_name ?? ''} onChange={(e) => setBiz({ ...biz, bank_account_name: e.target.value })} placeholder="Company Legal Name" style={IM} />
            </div>
            <div>
              <label style={L}>Bank name</label>
              <input value={biz.bank_name ?? ''} onChange={(e) => setBiz({ ...biz, bank_name: e.target.value })} placeholder="ING Bank N.V." style={IM} />
            </div>
            <div>
              <label style={L}>IBAN</label>
              <input value={biz.bank_account_number ?? ''} onChange={(e) => setBiz({ ...biz, bank_account_number: e.target.value })} placeholder="NL91 INGB 0002 4455 88" style={IM} />
            </div>
            <div>
              <label style={L}>SWIFT / BIC</label>
              <input value={biz.bank_swift ?? ''} onChange={(e) => setBiz({ ...biz, bank_swift: e.target.value })} placeholder="INGBNL2A" style={IM} />
            </div>
          </div>
        </>
      )}

      <SaveBtn saving={saving} label="Save business profile" />
    </form>
  )
}

// ── Delete account component ──────────────────────────────────────────────────

function DeleteSection() {
  const { data: session } = useSession()
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (session?.user?.email === 'admin@meridian.io') return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', border: '1px solid #274a3a', padding: '14px 20px' }}>
      Protected demo account — cannot be deleted.
    </div>
  )

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirm !== 'DELETE') return
    setDeleting(true)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) { await signOut({ callbackUrl: '/' }); return }
    const j = await res.json()
    setError(j.error ?? 'Failed.')
    setDeleting(false)
  }

  return (
    <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && <Msg ok={false} text={error} />}
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6, margin: 0 }}>
        This permanently deletes your account and all associated data. This cannot be undone.
      </p>
      <div>
        <label style={L}>Type DELETE to confirm</label>
        <input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" style={{ ...IM, maxWidth: 280 }} />
      </div>
      <button
        type="submit"
        disabled={confirm !== 'DELETE' || deleting}
        style={{
          background: confirm === 'DELETE' ? '#8b1c1c' : 'var(--nx-raised)',
          color: confirm === 'DELETE' ? '#fff' : 'var(--nx-muted)',
          border: `1px solid ${confirm === 'DELETE' ? '#8b1c1c' : 'var(--nx-border)'}`,
          padding: '12px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          cursor: confirm === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
          width: 'fit-content',
        }}
      >
        {deleting ? 'Deleting…' : 'Delete account permanently'}
      </button>
    </form>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') === 'business' ? 'business' : 'account'

  if (!session) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
    </div>
  )

  return (
    <>
      {tab === 'account' && (
        <>
          <AccountTab />
          <div style={{ borderTop: '1px solid var(--nx-border)', marginTop: 48, paddingTop: 32 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 20 }}>Danger zone</div>
            <DeleteSection />
          </div>
        </>
      )}

      {tab === 'business' && <BusinessTab />}
    </>
  )
}
