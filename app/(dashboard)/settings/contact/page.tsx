'use client'

import { useState } from 'react'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    // Simulate submission
    await new Promise((r) => setTimeout(r, 900))
    setSubmitting(false)
    setSubmitted(true)
  }

  const inputStyle = {
    background: 'var(--nx-bg)',
    border: '1px solid var(--nx-border)',
    color: 'var(--nx-fg-strong)',
    fontFamily: 'var(--font-serif)',
    fontSize: 15,
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
  }
  const labelStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: 9,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    color: 'var(--nx-muted)',
    display: 'block',
    marginBottom: 8,
  }

  return (
    <div>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 17, color: 'var(--nx-muted)', marginBottom: 32 }}>Get in touch with the NexusB2B team.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: '1px solid var(--nx-border)', marginBottom: 32 }}>
        <div style={{ padding: '20px 24px', borderRight: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Support</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>support@nexusb2b.io</div>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>Legal / Privacy</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>legal@nexusb2b.io</div>
        </div>
      </div>

      <div style={{ border: '1px solid var(--nx-border)' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Send a message</div>
        </div>

        {submitted ? (
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: '#5a9a7a', marginBottom: 14 }}>✓</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--nx-fg-strong)', marginBottom: 10 }}>MESSAGE SENT</div>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)' }}>
              We&apos;ll get back to you within 1–2 business days.
            </p>
            <button
              onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
              style={{ marginTop: 20, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', border: '1px solid var(--nx-border)', padding: '10px 18px', background: 'none', cursor: 'pointer' }}
            >
              Send another
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '28px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@company.com"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Subject *</label>
              <input
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="How can we help?"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Message *</label>
              <textarea
                required
                rows={6}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Describe your question or issue in detail…"
                style={{ ...inputStyle, resize: 'vertical', minHeight: 'unset' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  background: '#c44b1b',
                  color: '#ffffff',
                  border: 'none',
                  padding: '14px 28px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? 'Sending…' : 'Send message →'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
