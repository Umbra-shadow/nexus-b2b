'use client'

import { useState } from 'react'

type Status = 'pending' | 'verified' | 'rejected'

interface Props {
  businessId: string
  initialStatus: Status
}

const STATUS_COLOR: Record<Status, string> = {
  verified: '#5a9a7a',
  pending: '#c44b1b',
  rejected: 'var(--nx-muted)',
}
const STATUS_BORDER: Record<Status, string> = {
  verified: 'rgba(90,154,122,0.35)',
  pending: 'rgba(196,75,27,0.35)',
  rejected: 'var(--nx-border)',
}

export function VerificationActions({ businessId, initialStatus }: Props) {
  const [status, setStatus] = useState<Status>(initialStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Reject flow
  const [confirmingReject, setConfirmingReject] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // Request info flow
  const [confirmingInfo, setConfirmingInfo] = useState(false)
  const [infoMessage, setInfoMessage] = useState('')

  async function doAction(action: string, extra?: Record<string, string>) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/businesses/${businessId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Action failed.')
      } else {
        if (action === 'approve') { setStatus('verified'); setSuccess('Business approved — confirmation email sent.') }
        if (action === 'reject') { setStatus('rejected'); setSuccess('Business rejected — email sent.') }
        if (action === 'request_info') { setSuccess('Email sent to business admin.') }
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
      setConfirmingReject(false)
      setConfirmingInfo(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Status</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '4px 10px', border: `1px solid ${STATUS_BORDER[status]}`, color: STATUS_COLOR[status] }}>
          {status}
        </span>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Approve */}
        {status !== 'verified' && !confirmingReject && !confirmingInfo && (
          <button
            onClick={() => doAction('approve')}
            disabled={loading}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 16px', border: 'none', background: '#5a9a7a', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            ✓ Approve
          </button>
        )}

        {/* Reject */}
        {status !== 'rejected' && !confirmingInfo && (
          confirmingReject ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 240 }}>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason (optional) — sent to the business"
                rows={2}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '6px 10px', outline: 'none', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => doAction('reject', rejectReason.trim() ? { reason: rejectReason.trim() } : {})}
                  disabled={loading}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 14px', border: 'none', background: '#c44b1b', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? '…' : '✕ Confirm reject'}
                </button>
                <button
                  onClick={() => { setConfirmingReject(false); setRejectReason('') }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 8px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingReject(true)}
              disabled={loading}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 16px', border: '1px solid rgba(196,75,27,0.4)', background: 'none', color: '#c44b1b', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              ✕ Reject
            </button>
          )
        )}

        {/* Request info */}
        {!confirmingReject && (
          confirmingInfo ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 280 }}>
              <textarea
                value={infoMessage}
                onChange={(e) => setInfoMessage(e.target.value)}
                placeholder="What information do you need from them?"
                rows={3}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '6px 10px', outline: 'none', resize: 'none' }}
              />
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => doAction('request_info', { message: infoMessage })}
                  disabled={loading || !infoMessage.trim()}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', color: 'var(--nx-fg)', cursor: (loading || !infoMessage.trim()) ? 'not-allowed' : 'pointer', opacity: (loading || !infoMessage.trim()) ? 0.5 : 1 }}
                >
                  {loading ? '…' : '✉ Send request'}
                </button>
                <button
                  onClick={() => { setConfirmingInfo(false); setInfoMessage('') }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '7px 8px' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingInfo(true)}
              disabled={loading}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '8px 16px', border: '1px solid var(--nx-border)', background: 'none', color: 'var(--nx-fg)', cursor: loading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}
            >
              ? Request info
            </button>
          )
        )}
      </div>

      {error && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', letterSpacing: '0.04em' }}>✕ {error}</div>}
      {success && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', letterSpacing: '0.04em' }}>✓ {success}</div>}
    </div>
  )
}
