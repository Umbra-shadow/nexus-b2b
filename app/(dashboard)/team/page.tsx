'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

interface Member {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  email_verified: boolean
  created_at: string
  session_count?: number
  message_count?: number
  receipt_count?: number
  talking_with?: { id: string; name: string; initials: string }[]
}

function getInitials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
}

const ROLE_LABEL: Record<string, string> = {
  business_admin: 'Business Admin',
  business_agent: 'Business Agent',
  platform_admin: 'Platform Admin',
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  const w = Math.floor(d / 7)
  return `${w}w ago`
}

export default function TeamPage() {
  const { data: session } = useSession()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteName, setInviteName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteMsg, setInviteMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [businessName, setBusinessName] = useState('Team')
  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendResult, setResendResult] = useState<{ id: string; type: 'ok' | 'err'; text: string } | null>(null)

  const isAdmin = session?.user?.role === 'business_admin'

  async function fetchMembers() {
    const res = await fetch('/api/team')
    if (res.ok) {
      const json = await res.json()
      setMembers(json.members)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchMembers()
    fetch('/api/businesses/me')
      .then((r) => r.ok ? r.json() : null)
      .then((j) => { if (j?.business?.name) setBusinessName(j.business.name.toUpperCase() + ' TEAM') })
      .catch(() => {})
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteMsg(null)
    const res = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: inviteName, email: inviteEmail }),
    })
    setInviting(false)
    if (res.ok) {
      setInviteMsg({ type: 'ok', text: `Invite sent to ${inviteEmail}` })
      setInviteName('')
      setInviteEmail('')
      fetchMembers()
    } else {
      const json = await res.json()
      setInviteMsg({ type: 'err', text: json.error ?? 'Failed to send invite' })
    }
  }

  async function toggleActive(memberId: string, active: boolean) {
    await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !active }),
    })
    fetchMembers()
  }

  async function handleResendInvite(memberId: string, email: string) {
    setResendingId(memberId)
    setResendResult(null)
    const res = await fetch(`/api/team/${memberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend_invite' }),
    })
    setResendingId(null)
    const json = await res.json()
    if (res.ok) {
      setResendResult({ id: memberId, type: 'ok', text: `Invite sent to ${email}` })
    } else {
      setResendResult({ id: memberId, type: 'err', text: json.error ?? 'Failed to send invite' })
    }
    setTimeout(() => setResendResult(null), 6000)
  }

  const activeCount = members.filter((m) => m.is_active).length
  const totalSessions = members.reduce((n, m) => n + (m.session_count ?? 0), 0)
  const totalMessages = members.reduce((n, m) => n + (m.message_count ?? 0), 0)
  const totalReceipts = members.reduce((n, m) => n + (m.receipt_count ?? 0), 0)

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Team</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>{businessName}</h1>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            style={{ border: '1px solid #c44b1b', color: '#c44b1b', padding: '13px 22px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: 'pointer', background: 'none' }}
          >
            ＋ Invite member
          </button>
        )}
      </div>

      {/* Admin banner */}
      {isAdmin && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid #7a2a0c', padding: '3px 7px' }}>Admin view</span>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)' }}>As business admin you can see each member&apos;s sessions, who they&apos;ve spoken with, and their activity.</span>
        </div>
      )}

      {/* Totals strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', border: '1px solid var(--nx-border)', marginBottom: 24 }}>
        {[
          { label: 'Active members', value: activeCount },
          { label: 'Sessions handled', value: totalSessions },
          { label: 'Messages sent', value: totalMessages, accent: true },
          { label: 'Receipts created', value: totalReceipts },
        ].map((s, i) => (
          <div key={s.label} style={{ padding: '20px 22px', borderRight: i < 3 ? '1px solid var(--nx-border)' : undefined }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 10 }}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 46, lineHeight: 0.85, color: s.accent ? '#c44b1b' : 'var(--nx-fg-strong)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Invite form */}
      {showInvite && isAdmin && (
        <div style={{ border: '1px solid var(--nx-border)', padding: '20px 24px', marginBottom: 24, background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)', marginBottom: 16 }}>Invite a team member</div>
          {inviteMsg && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: inviteMsg.type === 'ok' ? '#5a9a7a' : '#c44b1b', border: `1px solid ${inviteMsg.type === 'ok' ? '#2a5a3a' : '#7a2a0c'}`, padding: '8px 14px', marginBottom: 14 }}>
              {inviteMsg.text}
            </div>
          )}
          <form onSubmit={handleInvite} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 140 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', display: 'block', marginBottom: 6 }}>Full name</label>
              <input value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Jane Doe" required className="nx-input" style={{ padding: '9px 12px' }} />
            </div>
            <div style={{ flex: 1.5, minWidth: 180 }}>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="jane@company.com" required className="nx-input" style={{ padding: '9px 12px' }} />
            </div>
            <button type="submit" disabled={inviting} style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '9px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              {inviting ? <Loader2 size={12} className="animate-spin" /> : null}
              Send
            </button>
          </form>
        </div>
      )}

      {/* Member cards */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
        </div>
      ) : members.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', borderTop: '1px solid var(--nx-border)' }}>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-muted)' }}>No team members yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {members.map((m) => {
            const act = m.is_active
            const roleLabel = ROLE_LABEL[m.role] ?? m.role
            const roleColor = m.role === 'business_admin' ? '#c44b1b' : 'var(--nx-muted)'
            const talkingWith = m.talking_with ?? []
            return (
              <div key={m.id} style={{ border: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
                {/* Top row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 22px', borderBottom: '1px solid var(--nx-line)' }}>
                  <div style={{ width: 42, height: 42, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 18, color: act ? 'var(--nx-fg-strong)' : 'var(--nx-subtle)', flexShrink: 0 }}>
                    {getInitials(m.name)}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: act ? 'var(--nx-fg-strong)' : 'var(--nx-subtle)' }}>{m.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: roleColor }}>· {roleLabel}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', marginTop: 2 }}>{m.email}</div>
                  </div>
                  <div style={{ flex: 1 }} />
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', color: 'var(--nx-subtle)', textTransform: 'uppercase', textAlign: 'right' }}>
                    Last active<br />
                    <span style={{ color: 'var(--nx-fg)' }}>{timeAgo(m.created_at)}</span>
                  </div>
                  {!m.email_verified ? (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8a240', border: '1px solid rgba(200,162,64,0.4)', padding: '4px 8px' }}>
                      Invite pending
                    </span>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: act ? '#5a9a7a' : 'var(--nx-muted)', border: `1px solid ${act ? '#274a3a' : 'var(--nx-strong)'}`, padding: '4px 8px' }}>
                      {act ? 'Active' : 'Deactivated'}
                    </span>
                  )}
                  {isAdmin && m.id !== session?.user?.id && !m.email_verified && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, maxWidth: 280 }}>
                      <button
                        onClick={() => handleResendInvite(m.id, m.email)}
                        disabled={resendingId === m.id}
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b', background: 'none', border: '1px solid rgba(196,75,27,0.3)', padding: '4px 10px', cursor: resendingId === m.id ? 'not-allowed' : 'pointer', opacity: resendingId === m.id ? 0.6 : 1, whiteSpace: 'nowrap' }}
                      >
                        {resendingId === m.id ? '…' : '↺ Resend invite'}
                      </button>
                      {resendResult?.id === m.id && (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: resendResult.type === 'ok' ? '#5a9a7a' : '#c44b1b', textAlign: 'right' }}>
                          {resendResult.text}
                        </span>
                      )}
                    </div>
                  )}
                  {isAdmin && m.id !== session?.user?.id && m.email_verified && (
                    <button
                      onClick={() => toggleActive(m.id, m.is_active)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: act ? 'var(--nx-muted)' : '#c44b1b', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      {act ? 'Deactivate' : 'Reactivate'}
                    </button>
                  )}
                </div>

                {/* Bottom: stats + talking with */}
                <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderRight: '1px solid var(--nx-line)' }}>
                    <div style={{ padding: '16px 18px', borderRight: '1px solid var(--nx-line)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>{m.session_count ?? 0}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 4 }}>Sessions</div>
                    </div>
                    <div style={{ padding: '16px 18px', borderRight: '1px solid var(--nx-line)' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 0.9, color: '#c44b1b' }}>{m.message_count ?? 0}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 4 }}>Messages</div>
                    </div>
                    <div style={{ padding: '16px 18px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>{m.receipt_count ?? 0}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 4 }}>Receipts</div>
                    </div>
                  </div>
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 10 }}>Talking with</div>
                    {talkingWith.length === 0 ? (
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-subtle)', fontStyle: 'italic' }}>No active sessions assigned.</div>
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {talkingWith.map((c) => (
                          <span key={c.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, border: '1px solid var(--nx-border)', padding: '5px 10px 5px 6px' }}>
                            <span style={{ width: 22, height: 22, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--nx-fg-strong)' }}>{c.initials}</span>
                            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)' }}>{c.name}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Pending invite row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', border: '1px dashed var(--nx-strong)' }}>
            <div style={{ width: 38, height: 38, border: '1px dashed var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--nx-subtle)', flexShrink: 0 }}>@</div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg)' }}>Invited members appear here</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)' }}>Invitations sent · awaiting acceptance</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c8a240', border: '1px solid #4a4020', padding: '4px 8px' }}>Pending</span>
          </div>
        </div>
      )}
    </div>
  )
}
