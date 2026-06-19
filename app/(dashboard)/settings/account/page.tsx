'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Loader2, X, AlertTriangle } from 'lucide-react'

// ── Shared style tokens ───────────────────────────────────────────────────────

const L: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--nx-muted)',
  display: 'block',
  marginBottom: 6,
}

const I: React.CSSProperties = {
  width: '100%',
  background: 'var(--nx-raised)',
  border: '1px solid var(--nx-border)',
  padding: '9px 12px',
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
  cursor: 'default',
}

// Read-only field: shows value but cannot be edited
const IRO: React.CSSProperties = {
  ...I,
  background: 'var(--nx-bg)',
  border: '1px solid var(--nx-border)',
  color: 'var(--nx-fg)',
  cursor: 'default',
}

const SH: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '0.2em',
  textTransform: 'uppercase',
  color: 'var(--nx-fg)',
  marginBottom: 10,
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
        padding: '10px 24px',
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div>
          <label style={L}>Phone</label>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
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

interface ChangeRequest {
  id: string
  type: string
  status: string
  requested_at: string
  reviewed_at: string | null
  admin_note: string | null
}

function BusinessTab() {
  const { data: session } = useSession()
  const [biz, setBiz] = useState<BizData | null>(null)
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [openSessions, setOpenSessions] = useState(0)

  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [draft, setDraft] = useState<BizData | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const isAdmin = session?.user?.role === 'business_admin'

  useEffect(() => {
    fetch('/api/businesses/me')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.business) setBiz(j.business); setLoading(false) })
      .catch(() => setLoading(false))

    fetch('/api/requests')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.requests) setRequests(j.requests.filter((r: ChangeRequest) => r.type === 'update_info')) })

    fetch('/api/sessions/counts')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j) setOpenSessions((j.pending ?? 0) + (j.active ?? 0)) })
  }, [])

  function openRequestModal() {
    if (!biz) return
    setDraft({ ...biz })
    setMsg(null)
    setShowModal(true)
  }

  async function submitRequest() {
    if (!draft) return
    setSubmitting(true)
    setMsg(null)

    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'update_info',
        payload: {
          name: draft.name,
          city: draft.city,
          website: draft.website,
          description: draft.description,
          bankAccountName: draft.bank_account_name,
          bankName: draft.bank_name,
          bankAccountNumber: draft.bank_account_number,
          bankSwift: draft.bank_swift,
        },
      }),
    })
    setSubmitting(false)

    const j = await res.json()
    if (res.ok) {
      setMsg({ ok: true, text: 'Update request submitted. Our team will review it shortly.' })
      // Refresh requests list
      fetch('/api/requests')
        .then((r) => r.ok ? r.json() : null)
        .then((j2) => { if (j2?.requests) setRequests(j2.requests.filter((r: ChangeRequest) => r.type === 'update_info')) })
      setTimeout(() => { setShowModal(false); setMsg(null) }, 2500)
    } else {
      setMsg({ ok: false, text: j.error ?? 'Failed to submit request.' })
    }
  }

  const pendingRequest = requests.find((r) => r.status === 'pending')

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
      <Loader2 size={20} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
    </div>
  )
  if (!biz) return null

  return (
    <>
      {/* ── Pending request banner ── */}
      {pendingRequest && (
        <div style={{ border: '1px solid rgba(196,75,27,0.4)', background: 'rgba(196,75,27,0.06)', padding: '10px 14px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={14} style={{ color: '#c44b1b', flexShrink: 0 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', color: '#c44b1b' }}>
            You have a pending update request submitted on {new Date(pendingRequest.requested_at).toLocaleDateString()}. It is under review by the platform team.
          </span>
        </div>
      )}

      {/* ── Read-only current profile ── */}
      <div style={SH}>Company profile <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', letterSpacing: '0.08em', textTransform: 'none', marginLeft: 8 }}>— read only</span></div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={L}>Company name</label>
          <input value={biz.name ?? ''} readOnly style={IRO} />
        </div>
        <div>
          <label style={L}>City</label>
          <input value={biz.city ?? ''} readOnly style={IRO} />
        </div>
        <div>
          <label style={L}>Website</label>
          <input value={biz.website ?? ''} readOnly style={IRO} />
        </div>
        <div>
          <label style={L}>Industry</label>
          <input value={biz.industry ?? ''} readOnly style={IRO} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={L}>Description</label>
        <textarea
          value={biz.description ?? ''}
          readOnly
          style={{ ...IRO, minHeight: 68, resize: 'none' }}
        />
      </div>

      {isAdmin && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <span style={SH}>Payment details</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5a9a7a', border: '1px solid #274a3a', padding: '2px 6px', marginBottom: 10 }}>
              🔒 Encrypted at rest
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={L}>Account holder</label>
              <input value={biz.bank_account_name ?? ''} readOnly style={IR} />
            </div>
            <div>
              <label style={L}>Bank name</label>
              <input value={biz.bank_name ?? ''} readOnly style={IR} />
            </div>
            <div>
              <label style={L}>IBAN</label>
              <input value={biz.bank_account_number ?? ''} readOnly style={IR} />
            </div>
            <div>
              <label style={L}>SWIFT / BIC</label>
              <input value={biz.bank_swift ?? ''} readOnly style={IR} />
            </div>
          </div>
        </>
      )}

      {/* ── Request update button ── */}
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            type="button"
            onClick={openRequestModal}
            disabled={!!pendingRequest}
            style={{
              background: pendingRequest ? 'var(--nx-raised)' : '#c44b1b',
              color: pendingRequest ? 'var(--nx-muted)' : '#ffffff',
              border: `1px solid ${pendingRequest ? 'var(--nx-border)' : '#c44b1b'}`,
              padding: '13px 24px',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              cursor: pendingRequest ? 'not-allowed' : 'pointer',
            }}
          >
            {pendingRequest ? 'Update pending review' : 'Request Update →'}
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.06em', lineHeight: 1.5 }}>
            Changes require platform approval.
          </span>
        </div>
      )}

      {/* ── Recent requests history ── */}
      {requests.length > 0 && (
        <div style={{ marginTop: 20, borderTop: '1px solid var(--nx-border)', paddingTop: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 14 }}>Update Request History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {requests.map((r) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
                <span style={{
                  fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                  padding: '2px 7px',
                  background: r.status === 'approved' ? 'rgba(90,154,122,0.12)' : r.status === 'rejected' ? 'rgba(196,75,27,0.1)' : 'rgba(180,140,60,0.1)',
                  color: r.status === 'approved' ? '#5a9a7a' : r.status === 'rejected' ? '#c44b1b' : '#b48c3c',
                  border: `1px solid ${r.status === 'approved' ? 'rgba(90,154,122,0.3)' : r.status === 'rejected' ? 'rgba(196,75,27,0.3)' : 'rgba(180,140,60,0.3)'}`,
                  flexShrink: 0,
                }}>
                  {r.status}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)' }}>
                  {new Date(r.requested_at).toLocaleDateString()}
                </span>
                {r.admin_note && (
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', flex: 1 }}>
                    Note: {r.admin_note}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Request Update Modal ── */}
      {showModal && draft && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 24 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}
        >
          <div style={{ background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '36px 32px', width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>

            <button
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)' }}
            >
              <X size={16} />
            </button>

            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Request Update</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 0.92, color: 'var(--nx-fg-strong)', marginBottom: 20, textTransform: 'uppercase' }}>
              Propose Changes
            </h2>

            {/* Open sessions warning */}
            {openSessions > 0 && (
              <div style={{ border: '1px solid rgba(196,75,27,0.5)', background: 'rgba(196,75,27,0.06)', padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <AlertTriangle size={13} style={{ color: '#c44b1b', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', color: '#c44b1b', lineHeight: 1.6 }}>
                  You have {openSessions} open deal session{openSessions !== 1 ? 's' : ''}. We recommend closing all active conversations before requesting profile changes.
                </span>
              </div>
            )}

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', marginBottom: 24, lineHeight: 1.6 }}>
              Enter the new values below. These will be reviewed by the NexusB2B team before taking effect. Your current profile remains unchanged until approved.
            </p>

            {msg && <Msg ok={msg.ok} text={msg.text} />}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
              <div>
                <label style={L}>Company name</label>
                <input value={draft.name ?? ''} onChange={(e) => setDraft({ ...draft, name: e.target.value })} style={I} />
              </div>
              <div>
                <label style={L}>City</label>
                <input value={draft.city ?? ''} onChange={(e) => setDraft({ ...draft, city: e.target.value })} style={I} />
              </div>
              <div>
                <label style={L}>Website</label>
                <input value={draft.website ?? ''} onChange={(e) => setDraft({ ...draft, website: e.target.value })} placeholder="https://" style={I} />
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={L}>Description</label>
              <textarea
                value={draft.description ?? ''}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength={500}
                style={{ ...I, minHeight: 80, resize: 'vertical' }}
              />
            </div>

            {isAdmin && (
              <>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 14 }}>Payment details</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                  <div>
                    <label style={L}>Account holder</label>
                    <input value={draft.bank_account_name ?? ''} onChange={(e) => setDraft({ ...draft, bank_account_name: e.target.value })} placeholder="Company Legal Name" style={IM} />
                  </div>
                  <div>
                    <label style={L}>Bank name</label>
                    <input value={draft.bank_name ?? ''} onChange={(e) => setDraft({ ...draft, bank_name: e.target.value })} placeholder="ING Bank N.V." style={IM} />
                  </div>
                  <div>
                    <label style={L}>IBAN</label>
                    <input value={draft.bank_account_number ?? ''} onChange={(e) => setDraft({ ...draft, bank_account_number: e.target.value })} placeholder="NL91 INGB 0002 4455 88" style={IM} />
                  </div>
                  <div>
                    <label style={L}>SWIFT / BIC</label>
                    <input value={draft.bank_swift ?? ''} onChange={(e) => setDraft({ ...draft, bank_swift: e.target.value })} placeholder="INGBNL2A" style={IM} />
                  </div>
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{ border: '1px solid var(--nx-border)', background: 'none', color: 'var(--nx-fg)', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={submitRequest}
                disabled={submitting}
                style={{ flex: 1, background: '#c44b1b', color: '#ffffff', border: 'none', padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              >
                {submitting && <Loader2 size={12} className="animate-spin" />}
                {submitting ? 'Submitting…' : 'Submit Request →'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ── Danger zone ───────────────────────────────────────────────────────────────

function DangerZone() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'business_admin'
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteNote, setDeleteNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/requests')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.requests) setRequests(j.requests.filter((r: ChangeRequest) => r.type === 'delete_business')) })
  }, [isAdmin])

  const pendingDeleteRequest = requests.find((r) => r.status === 'pending')

  async function submitDeleteRequest() {
    setSubmitting(true)
    setMsg(null)
    const res = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'delete_business', payload: { reason: deleteNote } }),
    })
    setSubmitting(false)
    const j = await res.json()
    if (res.ok) {
      setMsg({ ok: true, text: 'Deletion request submitted. The NexusB2B team will review it and contact you.' })
      setTimeout(() => { setShowDeleteModal(false); setMsg(null) }, 3000)
    } else {
      setMsg({ ok: false, text: j.error ?? 'Failed to submit request.' })
    }
  }

  async function deactivateSelf() {
    // For non-admin members: soft-deactivate own account (data is preserved)
    const res = await fetch('/api/account', { method: 'DELETE' })
    if (res.ok) { await signOut({ callbackUrl: '/' }) }
  }

  if (session?.user?.email === 'admin@meridian.io') return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', border: '1px solid #274a3a', padding: '14px 20px' }}>
      Protected demo account — cannot be deleted.
    </div>
  )

  if (isAdmin) {
    return (
      <>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          Deleting your business account is permanent and irreversible. All team members will be deactivated. Session history, messages, and receipts are retained for compliance. This requires platform admin approval.
        </p>

        {pendingDeleteRequest ? (
          <div style={{ border: '1px solid rgba(196,75,27,0.4)', background: 'rgba(196,75,27,0.06)', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={14} style={{ color: '#c44b1b', flexShrink: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b' }}>
              Deletion request pending review since {new Date(pendingDeleteRequest.requested_at).toLocaleDateString()}.
            </span>
          </div>
        ) : (
          <button
            onClick={() => setShowDeleteModal(true)}
            style={{ border: '1px solid #8b1c1c', background: 'none', color: '#8b1c1c', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}
          >
            Request Business Deletion
          </button>
        )}

        {showDeleteModal && (
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', padding: 24 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowDeleteModal(false) }}
          >
            <div style={{ background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '36px 32px', width: '100%', maxWidth: 480, position: 'relative' }}>
              <button onClick={() => setShowDeleteModal(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)' }}>
                <X size={16} />
              </button>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#8b1c1c', marginBottom: 10 }}>/ Danger</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, lineHeight: 0.92, color: 'var(--nx-fg-strong)', marginBottom: 16, textTransform: 'uppercase' }}>
                Request Deletion
              </h2>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 20 }}>
                This will be reviewed by the platform team. Provide a reason below (optional). Your business remains active until the request is approved.
              </p>
              {msg && <Msg ok={msg.ok} text={msg.text} />}
              <div style={{ marginBottom: 20 }}>
                <label style={L}>Reason (optional)</label>
                <textarea
                  value={deleteNote}
                  onChange={(e) => setDeleteNote(e.target.value)}
                  placeholder="Why are you requesting deletion?"
                  style={{ ...I, minHeight: 80, resize: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowDeleteModal(false)} style={{ border: '1px solid var(--nx-border)', background: 'none', color: 'var(--nx-fg)', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button
                  onClick={submitDeleteRequest}
                  disabled={submitting}
                  style={{ flex: 1, background: '#8b1c1c', color: '#ffffff', border: 'none', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? 'Submitting…' : 'Submit Deletion Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Non-admin members: leave the team (soft-deactivate self)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6, margin: 0 }}>
        This removes you from the team. Your messages and session history remain on record under your business. This action cannot be undone without contacting the platform team.
      </p>
      <button
        onClick={deactivateSelf}
        style={{ border: '1px solid #8b1c1c', background: 'none', color: '#8b1c1c', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', width: 'fit-content' }}
      >
        Leave team
      </button>
    </div>
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
          <div style={{ borderTop: '1px solid var(--nx-border)', marginTop: 28, paddingTop: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 12 }}>Danger zone</div>
            <DangerZone />
          </div>
        </>
      )}

      {tab === 'business' && <BusinessTab />}
    </>
  )
}
