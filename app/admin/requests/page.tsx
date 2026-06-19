'use client'

import { useState, useEffect, useTransition } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

interface ChangeRequest {
  id: string
  business_id: string
  business_name: string
  type: string
  status: string
  requested_at: string
  reviewed_at: string | null
  admin_note: string | null
  payload: Record<string, unknown>
  requester_name: string
  requester_email: string
}

const TYPE_LABEL: Record<string, string> = {
  update_info: 'Profile Update',
  delete_business: 'Account Deletion',
}

const STATUS_COLOR: Record<string, string> = {
  pending:  '#b48c3c',
  approved: '#5a9a7a',
  rejected: '#c44b1b',
  cancelled: 'var(--nx-muted)',
}
const STATUS_BG: Record<string, string> = {
  pending:  'rgba(180,140,60,0.1)',
  approved: 'rgba(90,154,122,0.12)',
  rejected: 'rgba(196,75,27,0.1)',
  cancelled: 'transparent',
}

function formatPayload(payload: Record<string, unknown>): string {
  const lines: string[] = []
  const labels: Record<string, string> = {
    name: 'Company name',
    city: 'City',
    website: 'Website',
    description: 'Description',
    bankAccountName: 'Account holder',
    bankName: 'Bank name',
    bankAccountNumber: 'IBAN',
    bankSwift: 'SWIFT/BIC',
    reason: 'Reason',
  }
  for (const [key, label] of Object.entries(labels)) {
    if (payload[key] !== undefined && payload[key] !== null && payload[key] !== '') {
      lines.push(`${label}: ${payload[key]}`)
    }
  }
  return lines.join('\n')
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [isPending, startTransition] = useTransition()
  const [actionMsg, setActionMsg] = useState<{ id: string; ok: boolean; text: string } | null>(null)

  function fetchRequests(status: string) {
    setLoading(true)
    fetch(`/api/admin/requests?status=${status}`)
      .then((r) => r.ok ? r.json() : { requests: [] })
      .then((j) => { setRequests(j.requests); setLoading(false) })
  }

  useEffect(() => { fetchRequests(statusFilter) }, [statusFilter])

  function handleAction(id: string, action: 'approve' | 'reject') {
    startTransition(async () => {
      const res = await fetch(`/api/admin/requests/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note }),
      })
      const j = await res.json()
      if (res.ok) {
        setActionMsg({ id, ok: true, text: `Request ${action === 'approve' ? 'approved' : 'rejected'}.` })
        setActiveId(null)
        setNote('')
        fetchRequests(statusFilter)
      } else {
        setActionMsg({ id, ok: false, text: j.error ?? 'Action failed.' })
      }
      setTimeout(() => setActionMsg(null), 4000)
    })
  }

  const pendingCount = requests.filter((r) => r.status === 'pending').length

  return (
    <div style={{ padding: '36px 40px' }}>
      {/* Header */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ System Admin / Requests</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>CHANGE REQUESTS</h1>
        {pendingCount > 0 && statusFilter === 'pending' && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#b48c3c', border: '1px solid rgba(180,140,60,0.4)', padding: '5px 12px', background: 'rgba(180,140,60,0.08)', letterSpacing: '0.08em' }}>
            {pendingCount} pending
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--nx-border)', marginBottom: 28 }}>
        {['pending', 'approved', 'rejected', 'all'].map((s) => {
          const active = statusFilter === s
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase',
                padding: '0 4px 14px', marginRight: 24, cursor: 'pointer', background: 'none',
                border: 'none',
                borderBottom: `2px solid ${active ? '#c44b1b' : 'transparent'}`,
                color: active ? 'var(--nx-fg-strong)' : 'var(--nx-muted)',
              }}
            >
              {s}
            </button>
          )
        })}
      </div>

      {/* Requests list */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '48px 0', color: 'var(--nx-muted)' }}>
          <Loader2 size={16} className="animate-spin" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em' }}>Loading…</span>
        </div>
      ) : requests.length === 0 ? (
        <div style={{ padding: '48px 0', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)' }}>
          No {statusFilter === 'all' ? '' : statusFilter} requests found.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map((cr) => {
            const isOpen = activeId === cr.id
            return (
              <div
                key={cr.id}
                style={{
                  border: `1px solid ${isOpen ? '#c44b1b' : 'var(--nx-border)'}`,
                  background: isOpen ? 'rgba(196,75,27,0.03)' : 'var(--nx-raised)',
                  overflow: 'hidden',
                }}
              >
                {/* Summary row */}
                <div
                  style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', alignItems: 'center', padding: '14px 18px', cursor: cr.status === 'pending' ? 'pointer' : 'default', gap: 12 }}
                  onClick={() => { if (cr.status === 'pending') { setActiveId(isOpen ? null : cr.id); setNote('') } }}
                >
                  <div>
                    <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', marginBottom: 2 }}>{cr.business_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', letterSpacing: '0.04em' }}>{cr.requester_name} · {cr.requester_email}</div>
                  </div>
                  <div>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '3px 8px',
                      background: cr.type === 'delete_business' ? 'rgba(139,28,28,0.1)' : 'rgba(196,75,27,0.08)',
                      color: cr.type === 'delete_business' ? '#8b1c1c' : '#c44b1b',
                      border: `1px solid ${cr.type === 'delete_business' ? 'rgba(139,28,28,0.35)' : 'rgba(196,75,27,0.3)'}`,
                    }}>
                      {TYPE_LABEL[cr.type] ?? cr.type}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)' }}>
                    {new Date(cr.requested_at).toLocaleDateString()}
                  </div>
                  <div>
                    {cr.admin_note && (
                      <span style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--nx-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {cr.admin_note}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase',
                      padding: '3px 8px',
                      background: STATUS_BG[cr.status] ?? 'transparent',
                      color: STATUS_COLOR[cr.status] ?? 'var(--nx-muted)',
                      border: `1px solid ${STATUS_COLOR[cr.status] ?? 'var(--nx-border)'}33`,
                    }}>
                      {cr.status}
                    </span>
                  </div>
                </div>

                {/* Expanded: payload + actions */}
                {isOpen && (
                  <div style={{ borderTop: '1px solid var(--nx-border)', padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Proposed changes */}
                    <div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 10 }}>
                        {cr.type === 'delete_business' ? 'Deletion reason' : 'Proposed changes'}
                      </div>
                      <pre style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-fg)',
                        background: 'var(--nx-bg)', border: '1px solid var(--nx-border)',
                        padding: '12px 14px', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.7,
                      }}>
                        {formatPayload(cr.payload) || '(no details provided)'}
                      </pre>
                    </div>

                    {/* Admin note */}
                    <div>
                      <label style={{ ...Object.fromEntries(Object.entries({
                        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em',
                        textTransform: 'uppercase', color: 'var(--nx-muted)', display: 'block', marginBottom: 6,
                      })) }}>Admin note (optional)</label>
                      <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Reason for approval/rejection…"
                        style={{
                          width: '100%', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)',
                          padding: '10px 12px', fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)',
                          outline: 'none', resize: 'vertical', minHeight: 70,
                        }}
                      />
                    </div>

                    {actionMsg?.id === cr.id && (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: actionMsg.ok ? '#5a9a7a' : '#c44b1b', padding: '8px 12px', border: `1px solid ${actionMsg.ok ? '#274a3a' : '#7a2a0c'}` }}>
                        {actionMsg.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                      <button
                        onClick={() => handleAction(cr.id, 'approve')}
                        disabled={isPending}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: '#274a3a', border: '1px solid #274a3a', color: '#5a9a7a',
                          padding: '10px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                          cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
                        }}
                      >
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(cr.id, 'reject')}
                        disabled={isPending}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          background: 'none', border: '1px solid #7a2a0c', color: '#c44b1b',
                          padding: '10px 20px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase',
                          cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1,
                        }}
                      >
                        <XCircle size={13} /> Reject
                      </button>
                      <button
                        onClick={() => { setActiveId(null); setNote('') }}
                        style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--nx-muted)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', padding: '10px 12px' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
