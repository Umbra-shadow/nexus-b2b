'use client'

import { useState } from 'react'
import { MarketingShell } from '@/components/marketing/MarketingShell'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', company: '', subject: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
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
    <MarketingShell>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', width: '100%' }}>
        <header style={{ padding: '72px 0 48px', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 24 }}>/ Company / Contact</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(56px,8vw,108px)', lineHeight: 0.88, color: 'var(--nx-fg-strong)', marginBottom: 28, textTransform: 'uppercase' }}>
            Get In <span style={{ color: '#c44b1b' }}>Touch</span>
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, lineHeight: 1.7, color: 'var(--nx-muted)', maxWidth: 680 }}>
            Questions about verification, partnerships, or the platform? Send us a message and the right person will get back to you.
          </p>
        </header>

        <div style={{ padding: '48px 0 80px', animation: 'nx-rise 0.4s ease' }}>
          {/* Contact channels */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', border: '1px solid var(--nx-border)', marginBottom: 40 }} className="nx-contact-channels">
            {[
              { label: 'Support', value: 'support@nexusb2b.io' },
              { label: 'Partnerships', value: 'partners@nexusb2b.io' },
              { label: 'Legal / Privacy', value: 'legal@nexusb2b.io' },
            ].map((c, i) => (
              <div key={c.label} style={{ padding: '20px 24px', borderRight: i === 2 ? 'none' : '1px solid var(--nx-border)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 6 }}>{c.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg-strong)' }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div style={{ maxWidth: 760, border: '1px solid var(--nx-border)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--nx-border)', background: 'var(--nx-raised)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--nx-fg-strong)' }}>Send a message</div>
            </div>

            {submitted ? (
              <div style={{ padding: '56px 32px', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, color: '#5a9a7a', marginBottom: 14 }}>✓</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: 'var(--nx-fg-strong)', marginBottom: 10, textTransform: 'uppercase' }}>Message Sent</div>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)' }}>
                  Thanks for reaching out. We&apos;ll reply within 1–2 business days.
                </p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', company: '', subject: '', message: '' }) }}
                  style={{ marginTop: 22, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', border: '1px solid var(--nx-border)', padding: '10px 18px', background: 'none', cursor: 'pointer' }}
                >
                  Send another
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="nx-contact-row">
                  <div>
                    <label style={labelStyle}>Name *</label>
                    <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Jane Doe" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Work email *</label>
                    <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@company.com" style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Company</label>
                  <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Acme Inc." style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Subject *</label>
                  <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="How can we help?" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Message *</label>
                  <textarea required rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Tell us a little about what you need…" style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '14px 28px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
                  >
                    {submitting ? 'Sending…' : 'Send message →'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:680px){.nx-contact-channels{grid-template-columns:1fr !important;}.nx-contact-row{grid-template-columns:1fr !important;}}`}</style>
    </MarketingShell>
  )
}
