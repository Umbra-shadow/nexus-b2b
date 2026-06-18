'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Paperclip, FileText, Landmark, Mail } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { ChatMessage } from '@/lib/db/dynamo'
import type { SessionWithDetails } from '@/types/session'
import { geminiHeaders } from '@/lib/client/gemini-key'

function getInitials(name: string) {
  return name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
}

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  } catch {
    return ''
  }
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)', flexShrink: 0, minWidth: 52 }}>{label}</span>
      <span style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-serif)', fontSize: mono ? 12 : 14, color: 'var(--nx-fg-strong)', wordBreak: 'break-all' }}>{value}</span>
    </div>
  )
}

interface ReceiptRow {
  id: string
  total: string
  currency: string
  status: string
  issuer_name: string
  receiver_name: string
}

export default function SessionPage() {
  const params = useParams()
  const router = useRouter()
  const { data: authSession } = useSession()
  const sessionId = params.id as string

  const [session, setSession] = useState<SessionWithDetails | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [receipts, setReceipts] = useState<ReceiptRow[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [rcItems, setRcItems] = useState<{ description: string; qty: string; unitPrice: string }[]>([{ description: '', qty: '1', unitPrice: '' }])
  const [rcCurrency, setRcCurrency] = useState('EUR')
  const [rcTaxRate, setRcTaxRate] = useState('')
  const [rcNotes, setRcNotes] = useState('')
  const [rcError, setRcError] = useState<string | null>(null)
  const [creatingReceipt, setCreatingReceipt] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [showLummyPanel, setShowLummyPanel] = useState(false)
  const [lummyInput, setLummyInput] = useState('')
  const [lummyMessages, setLummyMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [lummyLoading, setLummyLoading] = useState(false)
  const [closing, setClosing] = useState(false)
  const [confirmingClose, setConfirmingClose] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [resendingInvite, setResendingInvite] = useState(false)
  const [resendInviteStatus, setResendInviteStatus] = useState<'idle' | 'sent' | 'error'>('idle')
  const [resendInviteError, setResendInviteError] = useState('')
  const [confirmingCancel, setConfirmingCancel] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  // Attachment panel
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [showBankModal, setShowBankModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [bankForm, setBankForm] = useState({ bankName: '', accountName: '', iban: '', swift: '' })
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' })
  const [sendingCard, setSendingCard] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const prevMsgCountRef = useRef(0)

  const fetchMessages = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}/messages`)
    if (res.ok) {
      const json = await res.json()
      setMessages(json.messages)
    }
  }, [sessionId])

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/sessions/${sessionId}`)
    if (res.ok) {
      const json = await res.json()
      setSession(json.session)
      if (json.session.invitationUrl) setInvitationUrl(json.session.invitationUrl)
    }
  }, [sessionId])

  const fetchReceipts = useCallback(async () => {
    const res = await fetch(`/api/receipts?sessionId=${sessionId}`)
    if (res.ok) {
      const json = await res.json()
      setReceipts(json.receipts ?? [])
    }
  }, [sessionId])

  useEffect(() => {
    async function init() {
      await Promise.all([fetchSession(), fetchMessages(), fetchReceipts()])
      setLoading(false)
    }
    init()
    pollRef.current = setInterval(() => { fetchMessages(); fetchReceipts() }, 3000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchSession, fetchMessages, fetchReceipts])

  // Pre-fill contact card from stored account info
  useEffect(() => {
    fetch('/api/account').then(r => r.ok ? r.json() : null).then(j => {
      if (!j?.user) return
      setContactForm({
        name: j.user.name ?? '',
        email: j.user.email ?? '',
        phone: j.user.phone ?? '',
      })
    })
  }, [])

  useEffect(() => {
    // Only scroll to bottom when a new message actually arrives — not on every poll
    if (messages.length > prevMsgCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMsgCountRef.current = messages.length
  }, [messages])

  async function sendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!input.trim() || sending) return

    const content = input.trim()
    setInput('')
    setSending(true)
    try {
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...geminiHeaders() },
        body: JSON.stringify({ content }),
      })
      await fetchMessages()
    } finally {
      setSending(false)
    }
  }

  async function sendToLummy() {
    const question = lummyInput.trim()
    if (!question || lummyLoading) return
    setLummyInput('')
    setLummyMessages((prev) => [...prev, { role: 'user', text: question }])
    setLummyLoading(true)
    try {
      const res = await fetch(`/api/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...geminiHeaders() },
        body: JSON.stringify({ question, sessionId, private: true }),
      })
      const json = await res.json()
      const answer = json.answer ?? json.message ?? 'I was unable to answer that. Please try rephrasing.'
      setLummyMessages((prev) => [...prev, { role: 'ai', text: answer }])
    } catch {
      setLummyMessages((prev) => [...prev, { role: 'ai', text: 'Something went wrong. Please try again.' }])
    } finally {
      setLummyLoading(false)
    }
  }

  async function uploadDocument(file: File) {
    setUploadingDoc(true)
    setShowAttachMenu(false)
    try {
      const fd = new FormData()
      fd.append('file', file)
      await fetch(`/api/sessions/${sessionId}/attachments`, { method: 'POST', body: fd })
      await fetchMessages()
    } finally {
      setUploadingDoc(false)
    }
  }

  async function sendCard(cardContent: object) {
    setSendingCard(true)
    try {
      await fetch(`/api/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: JSON.stringify(cardContent), type: 'card' }),
      })
      await fetchMessages()
    } finally {
      setSendingCard(false)
    }
  }

  async function sendBankCard() {
    if (!bankForm.bankName && !bankForm.iban) return
    await sendCard({ cardType: 'bank', ...bankForm })
    setShowBankModal(false)
    setBankForm({ bankName: '', accountName: '', iban: '', swift: '' })
  }

  async function sendContactCard() {
    if (!contactForm.email && !contactForm.name) return
    await sendCard({ cardType: 'contact', ...contactForm })
    setShowContactModal(false)
    setContactForm({ name: '', email: '', phone: '' })
  }

  async function closeSession() {
    if (closing) return
    setClosing(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/close`, { method: 'POST' })
      if (res.ok) {
        await fetchSession()
        await fetchMessages()
      }
    } finally {
      setClosing(false)
    }
  }

  async function resendInvitation() {
    setResendingInvite(true)
    setResendInviteStatus('idle')
    setResendInviteError('')
    try {
      const res = await fetch(`/api/sessions/${sessionId}/resend-invitation`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setResendInviteStatus('sent')
      } else {
        setResendInviteStatus('error')
        setResendInviteError(json.error ?? 'Failed to send.')
      }
    } catch {
      setResendInviteStatus('error')
      setResendInviteError('Network error. Please try again.')
    } finally {
      setResendingInvite(false)
    }
  }

  async function cancelInvitation() {
    setCancelling(true)
    try {
      const res = await fetch(`/api/sessions/${sessionId}/cancel`, { method: 'POST' })
      if (res.ok) {
        router.push('/sessions')
      } else {
        const json = await res.json()
        alert(json.error ?? 'Could not cancel invitation.')
        setCancelling(false)
        setConfirmingCancel(false)
      }
    } catch {
      setCancelling(false)
      setConfirmingCancel(false)
    }
  }

  async function copyInviteLink() {
    if (!invitationUrl) return
    try {
      await navigator.clipboard.writeText(invitationUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    } catch {
      // fallback: select text
    }
  }

  async function createReceipt() {
    const validItems = rcItems.filter(i => i.description.trim() && parseFloat(i.unitPrice) > 0)
    if (validItems.length === 0) { setRcError('Add at least one line item with a description and price.'); return }
    setCreatingReceipt(true)
    setRcError(null)
    try {
      const taxRate = rcTaxRate ? Math.min(1, parseFloat(rcTaxRate) / 100) : 0
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          items: validItems.map(i => ({
            description: i.description.trim(),
            qty: Math.max(1, parseFloat(i.qty) || 1),
            unitPrice: parseFloat(i.unitPrice),
          })),
          currency: rcCurrency,
          taxRate,
          notes: rcNotes.trim() || null,
        }),
      })
      if (res.ok) {
        setShowReceiptModal(false)
        setRcItems([{ description: '', qty: '1', unitPrice: '' }])
        setRcCurrency('EUR')
        setRcTaxRate('')
        setRcNotes('')
        setRcError(null)
        await Promise.all([fetchMessages(), fetchReceipts()])
      } else {
        const j = await res.json().catch(() => ({}))
        setRcError(j.error ?? `Server error (${res.status}). Please try again.`)
      }
    } catch (err) {
      setRcError('Network error. Please check your connection.')
      console.error('createReceipt error:', err)
    } finally {
      setCreatingReceipt(false)
    }
  }

  function onComposerKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '80px 0' }}>
        <Loader2 size={24} className="animate-spin" style={{ color: 'var(--nx-muted)' }} />
      </div>
    )
  }

  if (!session) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-muted)' }}>Session not found.</p>
      </div>
    )
  }

  const myBizId = (authSession?.user as { businessId?: string })?.businessId ?? ''
  const myId = authSession?.user?.id ?? ''
  const isInitiator = session.initiatorBusiness.id === myBizId
  const theirBusiness = isInitiator ? session.receiverBusiness : session.initiatorBusiness
  const myBusiness = isInitiator ? session.initiatorBusiness : session.receiverBusiness
  const openedBy = isInitiator ? `You · ${myBusiness.name}` : theirBusiness.name
  const closed = session.status === 'closed'

  const statusColor: Record<string, string> = { active: '#5a9a7a', pending: '#c8a240', closed: 'var(--nx-muted)' }
  const sxStatusColor = statusColor[session.status] ?? 'var(--nx-muted)'

  // Detect if demo session: only when the other side's messages come from a 'demo:*' sender
  const isDemo = messages.some((m) => m.sender_id?.startsWith('demo:'))

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Main chat panel */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--nx-border)' }}>
        {/* Session header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 28px', borderBottom: '1px solid var(--nx-border)', flexShrink: 0 }}>
          <button
            onClick={() => router.push('/sessions')}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            ←
          </button>
          <div style={{ width: 40, height: 40, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 17, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
            {getInitials(theirBusiness.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--nx-fg-strong)' }}>{theirBusiness.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid #7a2a0c', padding: '2px 5px', flexShrink: 0 }}>✓ Verified</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', color: 'var(--nx-muted)', textTransform: 'uppercase', marginTop: 2 }}>
              {theirBusiness.industry}{theirBusiness.country ? ` · ${theirBusiness.country}` : ''}
            </div>
          </div>
          {!closed && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => { setRcError(null); setShowReceiptModal(true) }}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
              >
                ＋ Receipt
              </button>
              {confirmingClose ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid rgba(196,75,27,0.4)', padding: '6px 10px', background: 'rgba(196,75,27,0.06)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--nx-fg)', whiteSpace: 'nowrap' }}>Close permanently?</span>
                  <button
                    onClick={() => { setConfirmingClose(false); closeSession() }}
                    disabled={closing}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#fff', background: '#c44b1b', border: 'none', padding: '5px 10px', cursor: closing ? 'not-allowed' : 'pointer', opacity: closing ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  >
                    {closing ? '…' : '✕ Yes, close'}
                  </button>
                  <button
                    onClick={() => setConfirmingClose(false)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '5px 8px', whiteSpace: 'nowrap' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmingClose(true)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', background: 'none', padding: '10px 14px', border: '1px solid var(--nx-border)', cursor: 'pointer' }}
                >
                  Close session
                </button>
              )}
            </div>
          )}
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 28px', background: 'rgba(107,79,160,0.07)', borderBottom: '1px solid rgba(107,79,160,0.25)', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#7a5ab0', display: 'inline-block', animation: 'nx-dot 1.6s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: '#6b4fa0', textTransform: 'uppercase' }}>AI Demo Mode — this is a fictional business; replies are AI-generated</span>
          </div>
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.length === 0 && !loading && session.status !== 'pending' && (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-muted)' }}>
              Session started. Say hello!
            </div>
          )}

          {/* Pending invitation panel — shown until the other party accepts */}
          {session.status === 'pending' && isInitiator && (
            <div style={{ margin: '32px auto', width: '100%', maxWidth: 540, border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c8a240', marginBottom: 8 }}>◈ Awaiting acceptance</div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg)', lineHeight: 1.65, margin: 0 }}>
                  An invitation was sent to <strong style={{ color: 'var(--nx-fg-strong)' }}>{theirBusiness.name}</strong>. The session opens the moment they accept.
                  If the email didn&apos;t arrive, share the link below directly.
                </p>
              </div>

              {invitationUrl && (
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>Invitation link</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--nx-panel)', border: '1px solid var(--nx-line)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                      {invitationUrl}
                    </div>
                    <button
                      onClick={copyInviteLink}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 16px', border: copiedLink ? '1px solid #5a9a7a' : '1px solid var(--nx-border)', background: copiedLink ? 'rgba(90,154,122,0.12)' : 'var(--nx-panel)', color: copiedLink ? '#5a9a7a' : 'var(--nx-fg)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.2s' }}
                    >
                      {copiedLink ? '✓ Copied' : 'Copy →'}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <button
                    onClick={resendInvitation}
                    disabled={resendingInvite || resendInviteStatus === 'sent'}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 18px', border: '1px solid var(--nx-border)', background: 'none', color: resendInviteStatus === 'sent' ? '#5a9a7a' : 'var(--nx-fg)', cursor: (resendingInvite || resendInviteStatus === 'sent') ? 'not-allowed' : 'pointer', opacity: resendingInvite ? 0.6 : 1 }}
                  >
                    {resendingInvite ? 'Sending…' : resendInviteStatus === 'sent' ? '✓ Invitation sent' : '↺ Resend invitation email'}
                  </button>
                  {resendInviteStatus === 'error' && (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', letterSpacing: '0.04em' }}>
                      ✕ {resendInviteError}
                    </span>
                  )}
                </div>

                {/* Cancel invitation — right-aligned, two-step confirm */}
                {confirmingCancel ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-muted)', whiteSpace: 'nowrap' }}>Withdraw invitation?</span>
                    <button
                      onClick={cancelInvitation}
                      disabled={cancelling}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '6px 12px', border: 'none', background: '#c44b1b', color: '#fff', cursor: cancelling ? 'not-allowed' : 'pointer', opacity: cancelling ? 0.6 : 1, whiteSpace: 'nowrap' }}
                    >
                      {cancelling ? '…' : '✕ Yes, cancel'}
                    </button>
                    <button
                      onClick={() => setConfirmingCancel(false)}
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', whiteSpace: 'nowrap' }}
                    >
                      Keep
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmingCancel(true)}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 16px', border: '1px solid rgba(196,75,27,0.3)', background: 'none', color: '#c44b1b', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    ✕ Cancel invitation
                  </button>
                )}
              </div>
            </div>
          )}

          {session.status === 'pending' && !isInitiator && (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-muted)' }}>
              You have been invited to this session. Accept via your invitation link to begin.
            </div>
          )}

          {messages.map((msg) => {
            const isOwn = msg.sender_id === myId
            const isAI = msg.sender_id === 'ai' || msg.type === 'ai_response'
            const isSystem = msg.type === 'system'
            const isLummy = msg.sender_id === 'lummy'

            // AI intro box (purple-bordered)
            if (isAI) {
              return (
                <div key={msg.message_id} style={{ border: '1px solid rgba(107,79,160,0.3)', background: 'rgba(107,79,160,0.05)', padding: '18px 20px', margin: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b4fa0' }}>◇ NexusB2B AI · Introduction</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg)', lineHeight: 1.65, margin: 0 }}>{msg.content}</p>
                </div>
              )
            }

            // System message
            if (isSystem) {
              return (
                <div key={msg.message_id} style={{ textAlign: 'center', padding: '4px 0' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: 'var(--nx-subtle)', fontStyle: 'italic' }}>{msg.content}</span>
                </div>
              )
            }

            // Lummy AI assistant
            if (isLummy) {
              return (
                <div key={msg.message_id} style={{ alignSelf: 'flex-start', maxWidth: '82%', border: '1px solid rgba(107,79,160,0.35)', background: 'rgba(107,79,160,0.06)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6b4fa0' }}>✦ Lummy · AI assistant</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)', lineHeight: 1.65, margin: 0 }}>{msg.content}</p>
                </div>
              )
            }

            // Attachment message (PDF)
            if (msg.type === 'attachment') {
              const sizeKb = msg.attachment_size ? Math.round(msg.attachment_size / 1024) : null
              return (
                <div key={msg.message_id} style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', maxWidth: '68%' }}>
                  <div style={{ border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 36, height: 36, background: 'rgba(196,75,27,0.12)', border: '1px solid rgba(196,75,27,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} style={{ color: '#c44b1b' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.attachment_name ?? msg.content}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', marginTop: 3 }}>PDF{sizeKb ? ` · ${sizeKb} KB` : ''}</div>
                    </div>
                    {msg.attachment_url && (
                      <a href={msg.attachment_url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', color: '#c44b1b', textDecoration: 'none', border: '1px solid rgba(196,75,27,0.4)', padding: '5px 10px', flexShrink: 0 }}>↓ Open</a>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', textAlign: isOwn ? 'right' : 'left', marginTop: 5 }}>
                    {msg.sender_name} · {formatTime(msg.created_at ?? '')}
                  </div>
                </div>
              )
            }

            // Card message (bank details or contact info)
            if (msg.type === 'card') {
              let card: Record<string, string> = {}
              try { card = JSON.parse(msg.content) } catch { card = {} }
              const isBank = card.cardType === 'bank'
              const cardColor = isBank ? '#3a6a4a' : '#2a4a7a'
              const cardBorderColor = isBank ? 'rgba(58,106,74,0.4)' : 'rgba(42,74,122,0.4)'
              const cardBg = isBank ? 'rgba(58,106,74,0.08)' : 'rgba(42,74,122,0.08)'
              return (
                <div key={msg.message_id} style={{ alignSelf: isOwn ? 'flex-end' : 'flex-start', maxWidth: '68%' }}>
                  <div style={{ border: `1px solid ${cardBorderColor}`, background: cardBg, padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      {isBank ? <Landmark size={13} style={{ color: cardColor }} /> : <Mail size={13} style={{ color: cardColor }} />}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: cardColor }}>
                        {isBank ? 'Bank details' : 'Contact info'}
                      </span>
                    </div>
                    {isBank ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {card.bankName && <Row label="Bank" value={card.bankName} />}
                        {card.accountName && <Row label="Account" value={card.accountName} />}
                        {card.iban && <Row label="IBAN" value={card.iban} mono />}
                        {card.swift && <Row label="SWIFT" value={card.swift} mono />}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {card.name && <Row label="Name" value={card.name} />}
                        {card.email && <Row label="Email" value={card.email} mono />}
                        {card.phone && <Row label="Phone" value={card.phone} mono />}
                      </div>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', textAlign: isOwn ? 'right' : 'left', marginTop: 5 }}>
                    {msg.sender_name} · {formatTime(msg.created_at ?? '')}
                  </div>
                </div>
              )
            }

            // Own messages (right, orange)
            if (isOwn) {
              return (
                <div key={msg.message_id} style={{ alignSelf: 'flex-end', maxWidth: '74%' }}>
                  <div style={{ background: '#c44b1b', color: '#ffffff', padding: '13px 17px', fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.65, wordBreak: 'break-word', overflowWrap: 'break-word', whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', textAlign: 'right', marginTop: 5 }}>You · {formatTime(msg.created_at ?? '')}</div>
                </div>
              )
            }

            // Counterpart messages (left, raised bg)
            const isDemo = msg.sender_id?.startsWith('demo:')
            return (
              <div key={msg.message_id} style={{ alignSelf: 'flex-start', maxWidth: '74%' }}>
                <div style={{
                  background: isDemo ? 'rgba(107,79,160,0.05)' : 'var(--nx-raised)',
                  border: `1px solid ${isDemo ? 'rgba(107,79,160,0.25)' : 'var(--nx-border)'}`,
                  color: 'var(--nx-fg-strong)',
                  padding: '13px 17px',
                  fontFamily: 'var(--font-serif)',
                  fontSize: 16,
                  lineHeight: 1.65,
                  wordBreak: 'break-word',
                  overflowWrap: 'break-word',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{msg.sender_name ?? theirBusiness.name} · {formatTime(msg.created_at ?? '')}</span>
                  {isDemo && (
                    <span style={{ color: '#6b4fa0', border: '1px solid rgba(107,79,160,0.4)', padding: '1px 5px', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      AI · Demo
                    </span>
                  )}
                </div>
              </div>
            )
          })}

          {aiTyping && (
            <div style={{ alignSelf: 'flex-start', border: '1px solid rgba(107,79,160,0.35)', background: 'rgba(107,79,160,0.07)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: 9999, background: '#7a5ab0', display: 'inline-block', animation: `nx-dot 1.4s ${d}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        {!closed ? (
          <div style={{ borderTop: '1px solid var(--nx-border)', padding: '16px 28px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Ask Lummy */}
            <button
              type="button"
              onClick={() => setShowLummyPanel(true)}
              title="Open Lummy AI assistant"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6b4fa0', border: '1px solid rgba(107,79,160,0.4)', background: 'rgba(107,79,160,0.08)', padding: '13px 15px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 48 }}
            >
              ✦ Ask Lummy
            </button>

            {/* Attachment button — icon only, opens action menu above */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                type="button"
                onClick={() => setShowAttachMenu((v) => !v)}
                title="Share document or contact details"
                disabled={uploadingDoc}
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 48, height: 48, border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', cursor: uploadingDoc ? 'not-allowed' : 'pointer', color: uploadingDoc ? 'var(--nx-muted)' : 'var(--nx-fg)', flexShrink: 0 }}
              >
                {uploadingDoc ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              </button>

              {/* Dropdown menu — appears above the button */}
              {showAttachMenu && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, background: 'var(--nx-panel)', border: '1px solid var(--nx-border)', minWidth: 200, zIndex: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
                  {/* Hidden PDF file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) uploadDocument(file)
                      e.target.value = ''
                    }}
                  />
                  <button
                    onClick={() => { setShowAttachMenu(false); fileInputRef.current?.click() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--nx-border)', textAlign: 'left' }}
                  >
                    <FileText size={14} style={{ color: '#c44b1b', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)' }}>Document</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginTop: 2 }}>PDF · max 5 MB</div>
                    </div>
                  </button>
                  <button
                    onClick={async () => {
                      setShowAttachMenu(false)
                      try {
                        const res = await fetch('/api/businesses/me')
                        if (res.ok) {
                          const j = await res.json()
                          const b = j.business
                          if (b) {
                            setBankForm({
                              bankName: b.bank_name ?? '',
                              accountName: b.bank_account_name ?? '',
                              iban: b.bank_account_number ?? '',
                              swift: b.bank_swift ?? '',
                            })
                          }
                        }
                      } catch { /* ignore */ }
                      setShowBankModal(true)
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid var(--nx-border)', textAlign: 'left' }}
                  >
                    <Landmark size={14} style={{ color: '#3a6a4a', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)' }}>Bank details</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginTop: 2 }}>IBAN · SWIFT · account name</div>
                    </div>
                  </button>
                  <button
                    onClick={() => { setShowAttachMenu(false); setShowContactModal(true) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '13px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <Mail size={14} style={{ color: '#2a4a7a', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)' }}>Contact info</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginTop: 2 }}>Email · name · phone</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onComposerKey}
              placeholder="Write a message, or ask Lummy a question…"
              disabled={sending}
              style={{ flex: 1, background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', padding: '14px 16px', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)', outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={sending || !input.trim()}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 24px', border: 'none', cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !input.trim()) ? 0.5 : 1, flexShrink: 0, minHeight: 48, display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {sending ? <Loader2 size={14} className="animate-spin" /> : 'Send →'}
            </button>
          </div>
        ) : (
          <div style={{ borderTop: '1px solid var(--nx-border)', padding: '20px 28px', background: 'rgba(196,75,27,0.05)', textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c44b1b', margin: 0 }}>This session has ended.</p>
          </div>
        )}
      </div>

      {/* Right rail */}
      <div style={{ width: 300, flexShrink: 0, overflowY: 'auto', padding: 24 }}>
        {/* Counterpart card */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 14 }}>Counterpart</div>
        <div style={{ border: '1px solid var(--nx-border)', padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ width: 34, height: 34, border: '1px solid var(--nx-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--nx-fg-strong)', flexShrink: 0 }}>
              {getInitials(theirBusiness.name)}
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', lineHeight: 1.2 }}>{theirBusiness.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 3 }}>
                {theirBusiness.industry}{theirBusiness.country ? ` · ${theirBusiness.country}` : ''}{(theirBusiness as { city?: string | null }).city ? ` · ${(theirBusiness as { city?: string | null }).city}` : ''}
              </div>
            </div>
          </div>

          {(theirBusiness as { description?: string | null }).description && (
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', lineHeight: 1.5, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {(theirBusiness as { description?: string | null }).description}
            </p>
          )}

          {(theirBusiness as { website?: string | null }).website && (
            <a
              href={(theirBusiness as { website?: string | null }).website!}
              target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: '#c44b1b', textDecoration: 'none', marginBottom: 12 }}
            >
              ↗ {(theirBusiness as { website?: string | null }).website!.replace(/^https?:\/\/(www\.)?/, '')}
            </a>
          )}

          <div style={{ borderTop: '1px solid var(--nx-line)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Status</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: sxStatusColor, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{session.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)', flexShrink: 0 }}>Opened by</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg)', textAlign: 'right' }}>{openedBy}</span>
            </div>
          </div>
        </div>

        {/* Services selected for this session */}
        {(session as { selectedServices?: string[] }).selectedServices?.length ? (
          <>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 10 }}>Session focus</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {(session as { selectedServices?: string[] }).selectedServices!.map((s) => (
                <span key={s} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid rgba(196,75,27,0.4)', padding: '3px 8px' }}>{s}</span>
              ))}
            </div>
          </>
        ) : null}

        {/* Receipts in this room */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 14 }}>Receipts in this room</div>
        {receipts.length === 0 ? (
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-subtle)', fontStyle: 'italic', marginBottom: 8 }}>
            No receipts yet. Create one to record the deal.
          </div>
        ) : (
          receipts.map((r) => (
            <button
              key={r.id}
              onClick={() => router.push(`/receipts/${r.id}`)}
              style={{ display: 'block', width: '100%', border: '1px solid var(--nx-border)', padding: 14, marginBottom: 10, cursor: 'pointer', background: 'none', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)' }}>#{r.id.slice(0, 8).toUpperCase()}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: r.status === 'acknowledged' ? '#5a9a7a' : '#c8a240' }}>{r.status}</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, color: 'var(--nx-fg-strong)', lineHeight: 1 }}>
                {r.currency} {Number(r.total).toLocaleString()}
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', marginTop: 4, lineHeight: 1.3 }}>
                {r.issuer_name} → {r.receiver_name}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Bank details modal */}
      {showBankModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ width: 440, maxWidth: '100%', background: 'var(--nx-panel)', border: '1px solid var(--nx-strong)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--nx-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Landmark size={14} style={{ color: '#3a6a4a' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#3a6a4a' }}>Share bank details</span>
              </div>
              <button onClick={() => setShowBankModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', fontSize: 16, padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'bankName', label: 'Bank name', placeholder: 'e.g. KCB Bank' },
                { key: 'accountName', label: 'Account holder', placeholder: 'e.g. Meridian Logistics Ltd' },
                { key: 'iban', label: 'IBAN / Account no.', placeholder: 'e.g. KE12 3456 7890 1234 5678' },
                { key: 'swift', label: 'SWIFT / BIC', placeholder: 'e.g. KCBLKENX' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 7 }}>{label}</div>
                  <input
                    value={bankForm[key as keyof typeof bankForm]}
                    onChange={(e) => setBankForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', padding: '11px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowBankModal(false)} style={{ flex: 1, padding: 12, border: '1px solid var(--nx-strong)', background: 'none', color: 'var(--nx-fg)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                <button onClick={sendBankCard} disabled={sendingCard} style={{ flex: 2, padding: 12, background: '#3a6a4a', color: '#fff', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: sendingCard ? 'not-allowed' : 'pointer', opacity: sendingCard ? 0.6 : 1 }}>
                  {sendingCard ? 'Sending…' : 'Share in chat →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contact info modal */}
      {showContactModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ width: 440, maxWidth: '100%', background: 'var(--nx-panel)', border: '1px solid var(--nx-strong)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--nx-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={14} style={{ color: '#2a4a7a' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#2a4a7a' }}>Share contact info</span>
              </div>
              <button onClick={() => setShowContactModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', fontSize: 16, padding: 4 }}>✕</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'name', label: 'Contact name', placeholder: 'e.g. Jean-Paul Mbeki' },
                { key: 'email', label: 'Email address', placeholder: 'e.g. contact@company.com' },
                { key: 'phone', label: 'Phone / WhatsApp', placeholder: 'e.g. +254 712 345 678' },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 7 }}>{label}</div>
                  <input
                    value={contactForm[key as keyof typeof contactForm]}
                    onChange={(e) => setContactForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ width: '100%', background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', padding: '11px 14px', fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={() => setShowContactModal(false)} style={{ flex: 1, padding: 12, border: '1px solid var(--nx-strong)', background: 'none', color: 'var(--nx-fg)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                <button onClick={sendContactCard} disabled={sendingCard} style={{ flex: 2, padding: 12, background: '#2a4a7a', color: '#fff', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: sendingCard ? 'not-allowed' : 'pointer', opacity: sendingCard ? 0.6 : 1 }}>
                  {sendingCard ? 'Sending…' : 'Share in chat →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lummy private research panel — floats in corner, chat stays fully interactive */}
      {showLummyPanel && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 60, width: 420, maxWidth: 'calc(100vw - 48px)', background: 'var(--nx-panel)', border: '1px solid rgba(107,79,160,0.4)', display: 'flex', flexDirection: 'column', height: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.2)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(107,79,160,0.2)', background: 'rgba(107,79,160,0.06)', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b4fa0' }}>✦ Lummy · Private research</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 12, color: 'var(--nx-muted)', marginTop: 3 }}>Ask anything — this stays private, not in the session chat.</div>
              </div>
              <button onClick={() => setShowLummyPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', fontSize: 18, lineHeight: 1, padding: 4 }}>✕</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {lummyMessages.length === 0 && (
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-subtle)', fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                  Ask Lummy about market prices, trade regulations, industry benchmarks, or anything relevant to this deal.
                </div>
              )}
              {lummyMessages.map((m, i) => (
                <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
                  {m.role === 'user' ? (
                    <div style={{ background: '#c44b1b', color: '#fff', padding: '10px 14px', fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.6 }}>{m.text}</div>
                  ) : (
                    <div style={{ border: '1px solid rgba(107,79,160,0.35)', background: 'rgba(107,79,160,0.07)', padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6b4fa0', marginBottom: 8 }}>✦ Lummy</div>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', lineHeight: 1.65, margin: 0 }}>{m.text}</p>
                    </div>
                  )}
                </div>
              ))}
              {lummyLoading && (
                <div style={{ alignSelf: 'flex-start', border: '1px solid rgba(107,79,160,0.35)', background: 'rgba(107,79,160,0.07)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 9999, background: '#7a5ab0', display: 'inline-block', animation: `nx-dot 1.4s ${d}s infinite` }} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid rgba(107,79,160,0.2)', padding: '12px 16px', display: 'flex', gap: 10, flexShrink: 0 }}>
              <input
                value={lummyInput}
                onChange={(e) => setLummyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToLummy() } }}
                placeholder="What's the average price for…"
                disabled={lummyLoading}
                style={{ flex: 1, background: 'var(--nx-raised)', border: '1px solid rgba(107,79,160,0.35)', padding: '11px 14px', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', outline: 'none' }}
              />
              <button
                onClick={sendToLummy}
                disabled={lummyLoading || !lummyInput.trim()}
                style={{ background: '#7a5ab0', color: '#fff', border: 'none', padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', cursor: (lummyLoading || !lummyInput.trim()) ? 'not-allowed' : 'pointer', opacity: (lummyLoading || !lummyInput.trim()) ? 0.5 : 1 }}
              >
                Ask →
              </button>
            </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceiptModal && (() => {
        const taxPct = parseFloat(rcTaxRate) || 0
        const subtotal = rcItems.reduce((s, i) => s + (parseFloat(i.qty)||1) * (parseFloat(i.unitPrice)||0), 0)
        const tax = subtotal * taxPct / 100
        const total = subtotal + tax
        const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const CURRENCIES = ['EUR', 'USD', 'GBP', 'KES', 'NGN', 'ZAR', 'CHF', 'JPY']
        const inputStyle: React.CSSProperties = { background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', padding: '10px 12px', fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', outline: 'none', width: '100%' }
        const monoLabel: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 7 }
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
            <div style={{ width: 580, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', background: 'var(--nx-panel)', border: '1px solid var(--nx-strong)' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--nx-border)', position: 'sticky', top: 0, background: 'var(--nx-panel)', zIndex: 1 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c44b1b' }}>New receipt</div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', marginTop: 2 }}>To {theirBusiness.name}</div>
                </div>
                <button onClick={() => setShowReceiptModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', fontSize: 16, padding: 4 }}>✕</button>
              </div>

              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Currency */}
                <div>
                  <div style={monoLabel}>Currency</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {CURRENCIES.map(c => (
                      <button key={c} onClick={() => setRcCurrency(c)} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', padding: '7px 14px', border: `1px solid ${rcCurrency === c ? '#c44b1b' : 'var(--nx-border)'}`, background: rcCurrency === c ? '#c44b1b' : 'transparent', color: rcCurrency === c ? '#fff' : 'var(--nx-fg)', cursor: 'pointer' }}>{c}</button>
                    ))}
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div style={monoLabel}>Line items</div>
                  {/* Column headers */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 96px 80px 28px', gap: 6, marginBottom: 6 }}>
                    {['Description', 'Qty', 'Unit price', 'Total', ''].map(h => (
                      <div key={h} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-subtle)', textAlign: h === 'Description' ? 'left' : 'right' }}>{h}</div>
                    ))}
                  </div>
                  {rcItems.map((item, i) => {
                    const itemTotal = (parseFloat(item.qty)||1) * (parseFloat(item.unitPrice)||0)
                    return (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 96px 80px 28px', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                        <input value={item.description} onChange={e => setRcItems(prev => prev.map((it, j) => j===i ? { ...it, description: e.target.value } : it))} placeholder="Service / product description" style={{ ...inputStyle }} />
                        <input value={item.qty} onChange={e => setRcItems(prev => prev.map((it, j) => j===i ? { ...it, qty: e.target.value } : it))} type="number" min="1" step="1" placeholder="1" style={{ ...inputStyle, textAlign: 'right', padding: '10px 8px' }} />
                        <input value={item.unitPrice} onChange={e => setRcItems(prev => prev.map((it, j) => j===i ? { ...it, unitPrice: e.target.value } : it))} type="number" min="0" step="0.01" placeholder="0.00" style={{ ...inputStyle, textAlign: 'right', padding: '10px 8px' }} />
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)', textAlign: 'right' }}>{fmt(itemTotal)}</div>
                        {rcItems.length > 1 ? (
                          <button onClick={() => setRcItems(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-subtle)', fontSize: 14, padding: 0, textAlign: 'center' }}>✕</button>
                        ) : <div />}
                      </div>
                    )
                  })}
                  <button onClick={() => setRcItems(prev => [...prev, { description: '', qty: '1', unitPrice: '' }])} style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 4 }}>＋ Add line item</button>
                </div>

                {/* Tax + Notes row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <div style={monoLabel}>Tax rate (%)</div>
                    <input value={rcTaxRate} onChange={e => setRcTaxRate(e.target.value)} type="number" min="0" max="100" step="0.1" placeholder="0" style={inputStyle} />
                  </div>
                  <div>
                    <div style={monoLabel}>Notes (optional)</div>
                    <input value={rcNotes} onChange={e => setRcNotes(e.target.value)} placeholder="Payment terms, PO number, etc." style={inputStyle} />
                  </div>
                </div>

                {/* Totals */}
                <div style={{ borderTop: '1px solid var(--nx-border)', paddingTop: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ width: 260, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)' }}>Subtotal</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)' }}>{rcCurrency} {fmt(subtotal)}</span>
                      </div>
                      {taxPct > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)' }}>Tax ({taxPct}%)</span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)' }}>{rcCurrency} {fmt(tax)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--nx-border)', paddingTop: 8 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Total</span>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--nx-fg-strong)', lineHeight: 1 }}>{rcCurrency} {fmt(total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {rcError && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c44b1b', border: '1px solid #7a2a0c', padding: '10px 14px' }}>
                    {rcError}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button onClick={() => setShowReceiptModal(false)} style={{ flex: 1, padding: 13, border: '1px solid var(--nx-strong)', background: 'none', color: 'var(--nx-fg)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={createReceipt} disabled={creatingReceipt} style={{ flex: 2, padding: 13, background: '#c44b1b', color: '#fff', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: creatingReceipt ? 'not-allowed' : 'pointer', opacity: creatingReceipt ? 0.7 : 1 }}>
                    {creatingReceipt ? 'Creating…' : 'Create & share →'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
