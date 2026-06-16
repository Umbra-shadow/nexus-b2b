'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { Loader2, Check } from 'lucide-react'

function DeleteAccountForm() {
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault()
    if (confirm !== 'DELETE') return
    setDeleting(true)
    setError(null)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.status === 403) {
      const j = await res.json()
      setError(j.error)
      setDeleting(false)
      return
    }
    if (res.ok) {
      await signOut({ callbackUrl: '/' })
    } else {
      const j = await res.json()
      setError(j.error ?? 'Failed to delete account')
      setDeleting(false)
    }
  }

  return (
    <form onSubmit={handleDelete} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {error && (
        <div style={{ border: '1px solid #7a2a0c', background: 'rgba(196,75,27,0.08)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e07050' }}>
          {error}
        </div>
      )}
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6 }}>
        This will permanently delete your account and all associated data. This action cannot be undone.
      </p>
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>
          Type DELETE to confirm
        </div>
        <input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
          className="nx-input"
          style={{ maxWidth: 280, minHeight: 'unset', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 13 }}
        />
      </div>
      <button
        type="submit"
        disabled={confirm !== 'DELETE' || deleting}
        style={{
          background: confirm === 'DELETE' ? '#8b1c1c' : 'var(--nx-raised)',
          color: confirm === 'DELETE' ? '#ffffff' : 'var(--nx-muted)',
          border: '1px solid',
          borderColor: confirm === 'DELETE' ? '#8b1c1c' : 'var(--nx-border)',
          padding: '12px 20px',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase' as const,
          cursor: confirm === 'DELETE' && !deleting ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: 'fit-content',
        }}
      >
        {deleting ? <Loader2 size={12} className="animate-spin" /> : null}
        Delete account permanently
      </button>
    </form>
  )
}

export default function AccountSettingsPage() {
  const { data: session, update } = useSession()
  const [name, setName] = useState('')
  const [cur, setCur] = useState('')
  const [npw, setNpw] = useState('')
  const [cpw, setCpw] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [profileOk, setProfileOk] = useState(false)
  const [pwOk, setPwOk] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { if (session?.user?.name) setName(session.user.name) }, [session])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true); setError(null)
    const res = await fetch('/api/account', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) })
    setSavingProfile(false)
    if (res.ok) { await update({ name }); setProfileOk(true); setTimeout(() => setProfileOk(false), 3000) }
    else { const j = await res.json(); setError(j.error ?? 'Failed') }
  }

  async function savePw(e: React.FormEvent) {
    e.preventDefault()
    if (npw !== cpw) { setError('New passwords do not match'); return }
    if (npw.length < 12) { setError('Password must be at least 12 characters'); return }
    setSavingPw(true); setError(null)
    const res = await fetch('/api/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: cur, newPassword: npw }) })
    setSavingPw(false)
    if (res.ok) { setCur(''); setNpw(''); setCpw(''); setPwOk(true); setTimeout(() => setPwOk(false), 3000) }
    else { const j = await res.json(); setError(j.error ?? 'Failed') }
  }

  if (!session) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <Loader2 size={24} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
    </div>
  )

  const inputStyle = { background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', color: 'var(--nx-fg-strong)', fontFamily: 'var(--font-serif)', fontSize: 15, padding: '10px 14px', width: '100%', outline: 'none' }
  const labelStyle = { fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase' as const, color: 'var(--nx-muted)', display: 'block', marginBottom: 8 }

  return (
    <div style={{ padding: '28px 20px', maxWidth: 620, animation: 'nx-rise 0.4s ease' }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Settings</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>ACCOUNT</h1>
      </div>

      {error && (
        <div style={{ border: '1px solid #7a2a0c', background: 'rgba(196,75,27,0.08)', padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e07050', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* Profile section */}
      <div style={{ border: '1px solid var(--nx-border)', marginBottom: 24 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Profile</div>
        </div>
        <div style={{ padding: '24px' }}>
          {/* Current user info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--nx-line)' }}>
            <div style={{ width: 44, height: 44, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
              {(name || session.user.name || 'U').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-fg-strong)', marginBottom: 2 }}>{session.user.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>{session.user.email}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', textTransform: 'capitalize', marginTop: 2 }}>
                {(session.user as { role?: string }).role?.replace('_', ' ')}
              </div>
            </div>
          </div>
          <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Display name</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" required style={{ ...inputStyle, flex: 1 }} />
                <button type="submit" disabled={savingProfile} style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '10px 18px', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {savingProfile ? <Loader2 size={11} className="animate-spin" /> : profileOk ? <Check size={11} /> : null}
                  Save
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Password section */}
      <div style={{ border: '1px solid var(--nx-border)', marginBottom: 40 }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Change Password</div>
        </div>
        <div style={{ padding: '24px' }}>
          {pwOk && <div style={{ border: '1px solid #2a5a3a', background: 'rgba(90,154,122,0.07)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', marginBottom: 16 }}>Password changed successfully.</div>}
          <form onSubmit={savePw} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Current password</label>
              <input type="password" value={cur} onChange={(e) => setCur(e.target.value)} required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>New password</label>
              <input type="password" value={npw} onChange={(e) => setNpw(e.target.value)} placeholder="Min 12 chars, 1 uppercase, 1 number" required style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Confirm new password</label>
              <input type="password" value={cpw} onChange={(e) => setCpw(e.target.value)} required style={inputStyle} />
            </div>
            <button type="submit" disabled={savingPw} style={{ background: 'var(--nx-raised)', color: 'var(--nx-fg)', border: '1px solid var(--nx-border)', padding: '11px 18px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
              {savingPw ? <Loader2 size={11} className="animate-spin" /> : pwOk ? <Check size={11} /> : null}
              Change Password
            </button>
          </form>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ borderTop: '1px solid var(--nx-border)', paddingTop: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 20 }}>Danger zone</div>
        {session.user.email === 'admin@meridian.io' ? (
          <div style={{ border: '1px solid var(--nx-border)', padding: '20px 24px', marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5a9a7a', marginBottom: 8 }}>Protected account</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)' }}>
              This account is protected for the live demo and cannot be deleted.
            </p>
          </div>
        ) : (
          <DeleteAccountForm />
        )}
      </div>
    </div>
  )
}
