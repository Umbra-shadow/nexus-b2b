'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2, Paperclip, FileText, Landmark, Mail } from 'lucide-react'
import { useSession } from 'next-auth/react'
import type { ChatMessage } from '@/lib/db/dynamo'
import type { SessionWithDetails } from '@/types/session'

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
  const [rcAmount, setRcAmount] = useState('')
  const [rcDesc, setRcDesc] = useState('')
  const [creatingReceipt, setCreatingReceipt] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [showLummyPanel, setShowLummyPanel] = useState(false)
  const [lummyInput, setLummyInput] = useState('')
  const [lummyMessages, setLummyMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([])
  const [lummyLoading, setLummyLoading] = useState(false)
  const [closing, setClosing] = useState(false)
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  async function createReceipt() {
    const amt = parseFloat(rcAmount)
    if (!amt || !rcDesc.trim()) return
    setCreatingReceipt(true)
    try {
      const res = await fetch('/api/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          items: [{ description: rcDesc.trim(), qty: 1, unitPrice: amt }],
          currency: 'EUR',
          taxRate: 0,
          notes: null,
        }),
      })
      if (res.ok) {
        setShowReceiptModal(false)
        setRcAmount('')
        setRcDesc('')
        await Promise.all([fetchMessages(), fetchReceipts()])
      }
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

  // Detect if demo session (receiver has no real users — indicated by presence of demo: sender_id)
  const isDemo = messages.some((m) => m.sender_id?.startsWith('demo:') || m.type === 'system')

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
                onClick={() => setShowReceiptModal(true)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '10px 16px', border: 'none', cursor: 'pointer' }}
              >
                ＋ Receipt
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Close this session? This is permanent — both parties will lose the ability to send messages.')) {
                    closeSession()
                  }
                }}
                disabled={closing}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', background: 'none', padding: '10px 14px', border: '1px solid var(--nx-border)', cursor: closing ? 'not-allowed' : 'pointer', opacity: closing ? 0.5 : 1 }}
              >
                {closing ? 'Closing…' : 'Close session'}
              </button>
            </div>
          )}
        </div>

        {/* Demo banner */}
        {isDemo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 28px', background: 'rgba(122,90,176,0.08)', borderBottom: '1px solid #2a2040', flexShrink: 0 }}>
            <span style={{ width: 6, height: 6, borderRadius: 9999, background: '#7a5ab0', display: 'inline-block', animation: 'nx-dot 1.6s infinite' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', color: '#a98fd0', textTransform: 'uppercase' }}>AI Demo Mode — this is a fictional business; replies are AI-generated</span>
          </div>
        )}

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 28, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {messages.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-muted)' }}>
              {session.status === 'pending'
                ? 'Waiting for the other party to accept the invitation…'
                : 'Session started. Say hello!'}
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
                <div key={msg.message_id} style={{ border: '1px solid #2a2040', background: 'rgba(122,90,176,0.06)', padding: '18px 20px', margin: '4px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a98fd0' }}>◇ NexusB2B AI · Introduction</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', lineHeight: 1.6, margin: 0 }}>{msg.content}</p>
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
                <div key={msg.message_id} style={{ alignSelf: 'flex-start', maxWidth: '82%', border: '1px solid #4a3a6a', background: 'rgba(122,90,176,0.10)', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a98fd0' }}>✦ Lummy · AI assistant</span>
                  </div>
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-bright)', lineHeight: 1.55, margin: 0 }}>{msg.content}</p>
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
                  <div style={{ background: '#c44b1b', color: '#ffffff', padding: '13px 17px', fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.5 }}>{msg.content}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', textAlign: 'right', marginTop: 5 }}>You · {formatTime(msg.created_at ?? '')}</div>
                </div>
              )
            }

            // Counterpart messages (left, raised bg)
            return (
              <div key={msg.message_id} style={{ alignSelf: 'flex-start', maxWidth: '74%' }}>
                <div style={{ background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', color: 'var(--nx-fg-bright)', padding: '13px 17px', fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.5 }}>{msg.content}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-subtle)', marginTop: 5 }}>
                  {msg.sender_name ?? theirBusiness.name} · {formatTime(msg.created_at ?? '')}
                  {(msg.sender_id?.startsWith('demo:')) && <span style={{ color: '#7a5ab0' }}> · AI</span>}
                </div>
              </div>
            )
          })}

          {aiTyping && (
            <div style={{ alignSelf: 'flex-start', border: '1px solid #4a3a6a', background: 'rgba(122,90,176,0.10)', padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {[0, 0.2, 0.4].map((d, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: 9999, background: '#a98fd0', display: 'inline-block', animation: `nx-dot 1.4s ${d}s infinite` }} />
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
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a98fd0', border: '1px solid #4a3a6a', background: 'rgba(122,90,176,0.12)', padding: '13px 15px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, minHeight: 48 }}
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
                    onClick={() => { setShowAttachMenu(false); setShowBankModal(true) }}
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
        {/* Session info */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 16 }}>Session</div>
        <div style={{ border: '1px solid var(--nx-border)', padding: 18, marginBottom: 20 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Counterpart</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)', marginBottom: 14 }}>{theirBusiness.name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Status</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: sxStatusColor, marginBottom: 14, textTransform: 'capitalize' }}>{session.status}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Opened by</div>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)' }}>{openedBy}</div>
        </div>

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
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 60, width: 420, maxWidth: 'calc(100vw - 48px)', background: 'var(--nx-panel)', border: '1px solid #4a3a6a', display: 'flex', flexDirection: 'column', height: 480, boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #2a2040', background: 'rgba(122,90,176,0.08)', flexShrink: 0 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#a98fd0' }}>✦ Lummy · Private research</div>
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
                    <div style={{ background: '#c44b1b', color: '#fff', padding: '10px 14px', fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.5 }}>{m.text}</div>
                  ) : (
                    <div style={{ border: '1px solid #4a3a6a', background: 'rgba(122,90,176,0.10)', padding: '12px 16px' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#a98fd0', marginBottom: 8 }}>✦ Lummy</div>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-bright)', lineHeight: 1.6, margin: 0 }}>{m.text}</p>
                    </div>
                  )}
                </div>
              ))}
              {lummyLoading && (
                <div style={{ alignSelf: 'flex-start', border: '1px solid #4a3a6a', background: 'rgba(122,90,176,0.08)', padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.2, 0.4].map((d, i) => <span key={i} style={{ width: 5, height: 5, borderRadius: 9999, background: '#a98fd0', display: 'inline-block', animation: `nx-dot 1.4s ${d}s infinite` }} />)}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid #2a2040', padding: '12px 16px', display: 'flex', gap: 10, flexShrink: 0 }}>
              <input
                value={lummyInput}
                onChange={(e) => setLummyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendToLummy() } }}
                placeholder="What's the average price for…"
                disabled={lummyLoading}
                style={{ flex: 1, background: 'var(--nx-raised)', border: '1px solid #4a3a6a', padding: '11px 14px', fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg-strong)', outline: 'none' }}
              />
              <button
                onClick={sendToLummy}
                disabled={lummyLoading || !lummyInput.trim()}
                style={{ background: '#a98fd0', color: '#fff', border: 'none', padding: '11px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', cursor: (lummyLoading || !lummyInput.trim()) ? 'not-allowed' : 'pointer', opacity: (lummyLoading || !lummyInput.trim()) ? 0.5 : 1 }}
              >
                Ask →
              </button>
            </div>
        </div>
      )}

      {/* Receipt modal */}
      {showReceiptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 24 }}>
          <div style={{ width: 480, maxWidth: '100%', background: 'var(--nx-panel)', border: '1px solid var(--nx-strong)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--nx-border)' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c44b1b' }}>New receipt</span>
              <button onClick={() => setShowReceiptModal(false)} style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>✕</button>
            </div>
            <div style={{ padding: 24 }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.5, marginBottom: 20 }}>
                To <strong style={{ color: 'var(--nx-fg-strong)' }}>{theirBusiness.name}</strong>. Payment details are pulled from your stored banking info and shown on the receipt.
              </p>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>Amount (EUR)</div>
              <input
                value={rcAmount}
                onChange={(e) => setRcAmount(e.target.value)}
                placeholder="48500"
                type="number"
                style={{ width: '100%', background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', padding: '13px 15px', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--nx-fg-strong)', marginBottom: 18, outline: 'none' }}
              />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>Description</div>
              <textarea
                value={rcDesc}
                onChange={(e) => setRcDesc(e.target.value)}
                placeholder="What is this for?"
                style={{ width: '100%', background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', padding: '13px 15px', fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg-strong)', minHeight: 72, resize: 'vertical', marginBottom: 22, outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  onClick={() => setShowReceiptModal(false)}
                  style={{ flex: 1, textAlign: 'center', border: '1px solid var(--nx-strong)', color: 'var(--nx-fg)', padding: 13, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', background: 'none' }}
                >
                  Cancel
                </button>
                <button
                  onClick={createReceipt}
                  disabled={creatingReceipt || !rcAmount || !rcDesc.trim()}
                  style={{ flex: 1, textAlign: 'center', background: '#c44b1b', color: '#ffffff', padding: 13, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: creatingReceipt ? 'not-allowed' : 'pointer', border: 'none', opacity: creatingReceipt ? 0.7 : 1 }}
                >
                  {creatingReceipt ? 'Creating…' : 'Create & share →'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
