'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
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
  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
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

  async function askLummy() {
    const question = input.trim() || 'Can you give me a market price reference for this session?'
    setInput('')
    setAiTyping(true)
    setSending(true)
    try {
      await fetch(`/api/ai/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, sessionId }),
      })
      await fetchMessages()
    } finally {
      setAiTyping(false)
      setSending(false)
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
            <button
              onClick={() => setShowReceiptModal(true)}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '10px 16px', border: 'none', cursor: 'pointer', flexShrink: 0 }}
            >
              ＋ Receipt
            </button>
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
            <button
              type="button"
              onClick={askLummy}
              title="Ask Lummy a question"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#a98fd0', border: '1px solid #4a3a6a', background: 'rgba(122,90,176,0.12)', padding: '13px 15px', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              ✦ Ask Lummy
            </button>
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
              style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 22px', border: 'none', cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !input.trim()) ? 0.5 : 1, flexShrink: 0 }}
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
