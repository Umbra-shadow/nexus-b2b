'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const LS_KEY = 'NEXUSB2B_GEMINI_KEY'

const SUGGESTIONS = [
  'How many businesses are pending review?',
  'Who registered most recently?',
  'How many active deal sessions are there?',
  'What is the total receipt volume?',
]

export function AdminAIAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return

    const key = localStorage.getItem(LS_KEY) ?? ''
    setInput('')
    setError('')

    const next: Message[] = [...messages, { role: 'user', content: q }]
    setMessages(next)
    setLoading(true)

    try {
      const res = await fetch('/api/admin/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, key }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.answer }])
      }
    } catch {
      setError('Failed to reach AI.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em',
          textTransform: 'uppercase', padding: '7px 16px', flexShrink: 0,
          border: open ? '1px solid #c44b1b' : '1px solid var(--nx-border)',
          color: open ? '#c44b1b' : 'var(--nx-fg)',
          background: open ? 'rgba(196,75,27,0.06)' : 'var(--nx-raised)',
          cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >
        ◈ Ask AI
      </button>

      {/* Panel */}
      {open && (
        <>
          {/* Backdrop (click to close) */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />

          <div style={{
            position: 'fixed', top: 64, right: 0, width: 420,
            height: 'calc(100vh - 64px)', background: 'var(--nx-bg)',
            borderLeft: '1px solid var(--nx-border)', display: 'flex',
            flexDirection: 'column', zIndex: 50,
            boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
            animation: 'nx-rise 0.18s ease',
          }}>
            {/* Header */}
            <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--nx-border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.24em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 4 }}>
                    ◈ Admin AI Assistant
                  </div>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', lineHeight: 1.5 }}>
                    Ask about businesses, users, sessions, receipts, or platform activity.
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--nx-muted)', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: '0 0 0 12px', flexShrink: 0, marginTop: 2 }}
                >
                  ✕
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={() => { setMessages([]); setError('') }}
                  style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)', background: 'none', border: '1px solid var(--nx-line)', padding: '3px 8px', cursor: 'pointer', marginTop: 6 }}
                >
                  ↺ Clear chat
                </button>
              )}
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', lineHeight: 1.7, fontStyle: 'italic' }}>
                    I have access to live platform data — business registry, user accounts, deal sessions, and receipt ledger. Ask me anything.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        style={{
                          textAlign: 'left', fontFamily: 'var(--font-serif)', fontSize: 13,
                          color: 'var(--nx-fg)', background: 'var(--nx-raised)',
                          border: '1px solid var(--nx-border)', padding: '8px 12px',
                          cursor: 'pointer', lineHeight: 1.4,
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    padding: '10px 14px',
                    background: m.role === 'user' ? 'rgba(196,75,27,0.08)' : 'var(--nx-raised)',
                    border: `1px solid ${m.role === 'user' ? 'rgba(196,75,27,0.22)' : 'var(--nx-border)'}`,
                    fontFamily: m.role === 'user' ? 'var(--font-mono)' : 'var(--font-serif)',
                    fontSize: m.role === 'user' ? 12 : 13,
                    color: m.role === 'user' ? '#c44b1b' : 'var(--nx-fg)',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.content}
                </div>
              ))}

              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '10px 14px', background: 'var(--nx-raised)', border: '1px solid var(--nx-border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', letterSpacing: '0.1em' }}>
                  thinking…
                </div>
              )}

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(196,75,27,0.06)', border: '1px solid rgba(196,75,27,0.3)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c44b1b', lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ borderTop: '1px solid var(--nx-border)', padding: '14px 20px', display: 'flex', gap: 8, flexShrink: 0 }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                placeholder="Ask about users, businesses, sessions…"
                style={{
                  flex: 1, fontFamily: 'var(--font-serif)', fontSize: 13,
                  color: 'var(--nx-fg)', background: 'var(--nx-raised)',
                  border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none',
                }}
              />
              <button
                onClick={() => send()}
                disabled={loading || !input.trim()}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em',
                  textTransform: 'uppercase', padding: '9px 18px',
                  background: '#c44b1b', color: '#fff', border: 'none', flexShrink: 0,
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  opacity: loading || !input.trim() ? 0.5 : 1,
                }}
              >
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
