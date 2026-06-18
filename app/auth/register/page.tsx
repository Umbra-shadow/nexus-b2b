'use client'

import { useState, useRef, KeyboardEvent } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Upload, X } from 'lucide-react'
import { RegisterBusinessSchema, RegisterUserSchema, INDUSTRIES } from '@/lib/validators'
import { COUNTRIES } from '@/lib/constants/countries'
import type { z } from 'zod'

type BusinessData = z.infer<typeof RegisterBusinessSchema>
type UserData = z.infer<typeof RegisterUserSchema>

const STEPS = ['Business Details', 'Your Account']

function NxLogo({ light }: { light?: boolean }) {
  const fg = light ? '#ffffff' : 'var(--nx-fg-strong)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 26, height: 26, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', top: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', top: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', bottom: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 18, background: 'rgba(255,255,255,0.2)', left: '50%', top: 4 }} />
        <div style={{ position: 'absolute', height: 1, width: 18, background: 'rgba(255,255,255,0.2)', top: '50%', left: 4 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: fg }}>
        NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
      </span>
    </div>
  )
}

const NETWORK_FEATURES = [
  { glyph: '✓', text: 'Every business identity-verified before appearing in search' },
  { glyph: '✓', text: 'AI-mediated introductions — no cold reach-outs' },
  { glyph: '✓', text: 'Structured deal sessions with timestamped receipts' },
  { glyph: '✓', text: '2,400+ firms across 38 countries' },
]

const labelStyle = {
  fontFamily: 'var(--font-mono)',
  fontSize: 9,
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  color: 'var(--nx-muted)',
  display: 'block',
  marginBottom: 6,
}

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [businessData, setBusinessData] = useState<BusinessData | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [docFile, setDocFile] = useState<File | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<string[]>([])
  const [serviceInput, setServiceInput] = useState('')
  const serviceInputRef = useRef<HTMLInputElement>(null)

  const bizForm = useForm<BusinessData>({ resolver: zodResolver(RegisterBusinessSchema) })
  const userForm = useForm<UserData>({ resolver: zodResolver(RegisterUserSchema) })

  function addService() {
    const s = serviceInput.trim()
    if (!s || services.includes(s) || services.length >= 20) return
    setServices((prev) => [...prev, s])
    setServiceInput('')
  }

  function handleServiceKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addService()
    }
  }

  function removeService(s: string) {
    setServices((prev) => prev.filter((x) => x !== s))
  }

  async function onBizSubmit(data: BusinessData) {
    setBusinessData({ ...data, services })
    setStep(1)
  }

  async function onUserSubmit(data: UserData) {
    if (!businessData) return
    setSubmitting(true)
    setServerError(null)

    try {
      const fd = new FormData()
      fd.append('business', JSON.stringify(businessData))
      fd.append('user', JSON.stringify({ name: data.name, email: data.email, password: data.password }))
      if (logoFile) fd.append('logo', logoFile)
      if (docFile) fd.append('doc', docFile)

      const res = await fetch('/api/auth/register', { method: 'POST', body: fd })
      const json = await res.json()

      if (!res.ok) {
        setServerError(json.error ?? 'Registration failed. Please try again.')
        return
      }

      router.push('/auth/register/success')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--nx-bg)', position: 'relative' }}>

      {/* ─── Left visual panel ─── */}
      <div
        className="reg-left-panel"
        style={{
          display: 'none',
          flex: '0 0 560px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 52px',
          position: 'relative',
          overflow: 'hidden',
          background: '#0d0d0d',
        }}
      >
        {/* Decorative background — layered grid + amber vignette */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(196,75,27,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(196,75,27,0.07) 1px, transparent 1px)', backgroundSize: '56px 56px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(0deg, rgba(196,75,27,0.18) 0%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 360, height: 360, borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(196,75,27,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ position: 'relative' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <NxLogo light />
          </Link>
        </div>

        {/* Center content */}
        <div style={{ position: 'relative' }}>
          {/* Giant glyph */}
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 120, lineHeight: 0.8, color: 'rgba(196,75,27,0.18)', letterSpacing: '-0.04em', marginBottom: 32, userSelect: 'none' }}>
            NB2B
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 16 }}>/ Join the network</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.88, color: '#ffffff', marginBottom: 24 }}>
            VERIFIED.<br />STRUCTURED.<br />TRUSTED.
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.75, color: 'rgba(255,255,255,0.55)', marginBottom: 36, maxWidth: 340 }}>
            NexusB2B is a closed network. Every company goes through identity verification before they can discover or be discovered.
          </p>

          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {NETWORK_FEATURES.map((f) => (
              <div key={f.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', marginTop: 2, flexShrink: 0 }}>{f.glyph}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, lineHeight: 1.5, color: 'rgba(255,255,255,0.6)' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom caption */}
        <div style={{ position: 'relative' }}>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
              © 2026 NexusB2B · Verified B2B network
            </div>
          </div>
        </div>
      </div>

      {/* Back to home */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', textDecoration: 'none', border: '1px solid var(--nx-border)', padding: '7px 12px', display: 'inline-block', background: 'var(--nx-bg)' }}>
          ← Home
        </Link>
      </div>

      {/* ─── Right form panel ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 540 }}>

          {/* Mobile logo */}
          <div className="mobile-logo" style={{ marginBottom: 36 }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <NxLogo />
            </Link>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--nx-border)' }}>
            {STEPS.map((label, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <div style={{
                  width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-mono)', fontSize: 11, flexShrink: 0,
                  background: i === step ? '#c44b1b' : i < step ? 'rgba(196,75,27,0.15)' : 'transparent',
                  border: i === step ? 'none' : i < step ? '1px solid #c44b1b' : '1px solid var(--nx-border)',
                  color: i === step ? '#ffffff' : i < step ? '#c44b1b' : 'var(--nx-muted)',
                }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: i === step ? 'var(--nx-fg-strong)' : 'var(--nx-muted)', marginLeft: 9 }}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <div style={{ flex: 1, height: 1, background: i < step ? '#c44b1b' : 'var(--nx-border)', margin: '0 14px' }} />
                )}
              </div>
            ))}
          </div>

          {serverError && (
            <div style={{ border: '1px solid #7a2a0c', background: 'rgba(196,75,27,0.08)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e07050', marginBottom: 18 }}>
              {serverError}
            </div>
          )}

          {/* ── Step 1: Business ── */}
          {step === 0 && (
            <form onSubmit={bizForm.handleSubmit(onBizSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 8 }}>/ Step 1 of 2</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 8 }}>REGISTER YOUR BUSINESS</h1>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6 }}>Tell us about your company. All registrations are verified before appearing in search.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Business name *</label>
                  <input placeholder="Acme Corporation" className="nx-input nx-input-sm" {...bizForm.register('businessName')} />
                  {bizForm.formState.errors.businessName && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{bizForm.formState.errors.businessName.message}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Business contact email *</label>
                  <input type="email" placeholder="info@acme.com" className="nx-input nx-input-sm" {...bizForm.register('contactEmail')} />
                  {bizForm.formState.errors.contactEmail && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{bizForm.formState.errors.contactEmail.message}</div>}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-muted)', marginTop: 4, letterSpacing: '0.06em' }}>Used for session invitations and partner outreach</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Industry *</label>
                  <select className="nx-select nx-input-sm" {...bizForm.register('industry')}>
                    <option value="">Select industry</option>
                    {INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>{ind.charAt(0).toUpperCase() + ind.slice(1)}</option>
                    ))}
                  </select>
                  {bizForm.formState.errors.industry && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{bizForm.formState.errors.industry.message}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Country *</label>
                  <select className="nx-select nx-input-sm" {...bizForm.register('country')}>
                    <option value="">Select country</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                  {bizForm.formState.errors.country && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{bizForm.formState.errors.country.message}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>City</label>
                  <input placeholder="Berlin" className="nx-input nx-input-sm" {...bizForm.register('city')} />
                </div>
                <div>
                  <label style={labelStyle}>Website</label>
                  <input type="url" placeholder="https://acme.com" className="nx-input nx-input-sm" {...bizForm.register('website')} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Description</label>
                <textarea rows={3} maxLength={500} className="nx-input nx-input-sm" style={{ resize: 'none', minHeight: 'unset' }} placeholder="What does your business do? (max 500 chars)" {...bizForm.register('description')} />
              </div>

              {/* Services */}
              <div>
                <label style={labelStyle}>Services you offer</label>
                <div style={{ border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: '8px 12px', display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', cursor: 'text' }} onClick={() => serviceInputRef.current?.focus()}>
                  {services.map((s) => (
                    <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(196,75,27,0.1)', border: '1px solid rgba(196,75,27,0.3)', color: '#c44b1b', padding: '3px 8px' }}>
                      {s}
                      <button type="button" onClick={() => removeService(s)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#c44b1b', display: 'flex', alignItems: 'center' }}>
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <input
                    ref={serviceInputRef}
                    value={serviceInput}
                    onChange={(e) => setServiceInput(e.target.value)}
                    onKeyDown={handleServiceKey}
                    onBlur={addService}
                    placeholder={services.length === 0 ? 'Type a service, press Enter or comma…' : ''}
                    style={{ flex: 1, minWidth: 160, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg-strong)', padding: '3px 0' }}
                  />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', marginTop: 4, letterSpacing: '0.06em' }}>
                  Press Enter or comma after each service. These appear on your discovery card.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Company logo (PNG/JPG)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed var(--nx-border)', padding: '10px 14px', cursor: 'pointer' }}>
                    <Upload size={14} style={{ color: 'var(--nx-muted)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{logoFile ? logoFile.name : 'Upload logo'}</span>
                    <input type="file" style={{ display: 'none' }} accept="image/png,image/jpeg,image/webp" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
                  </label>
                </div>
                <div>
                  <label style={labelStyle}>Verification doc (PDF) *</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px dashed var(--nx-border)', padding: '10px 14px', cursor: 'pointer' }}>
                    <Upload size={14} style={{ color: 'var(--nx-muted)', flexShrink: 0 }} />
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{docFile ? docFile.name : 'Upload PDF'}</span>
                    <input type="file" style={{ display: 'none' }} accept="application/pdf" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
                  </label>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--nx-subtle)', marginTop: 4, letterSpacing: '0.06em' }}>Certificate of Incorporation or Business License</div>
                </div>
              </div>

              <button type="submit" style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '14px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer', marginTop: 4 }}>
                Continue →
              </button>
            </form>
          )}

          {/* ── Step 2: User account ── */}
          {step === 1 && (
            <form onSubmit={userForm.handleSubmit(onUserSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 8 }}>/ Step 2 of 2</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 8 }}>CREATE YOUR ACCOUNT</h1>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.6 }}>
                  You&apos;ll be the Business Admin for <strong style={{ color: 'var(--nx-fg-strong)' }}>{businessData?.businessName}</strong>.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Full name *</label>
                  <input placeholder="Jane Doe" className="nx-input nx-input-sm" {...userForm.register('name')} />
                  {userForm.formState.errors.name && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{userForm.formState.errors.name.message}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Work email *</label>
                  <input type="email" placeholder="jane@acme.com" className="nx-input nx-input-sm" {...userForm.register('email')} />
                  {userForm.formState.errors.email && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{userForm.formState.errors.email.message}</div>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Password *</label>
                  <input type="password" placeholder="Min 12 chars" className="nx-input nx-input-sm" {...userForm.register('password')} />
                  {userForm.formState.errors.password && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{userForm.formState.errors.password.message}</div>}
                </div>
                <div>
                  <label style={labelStyle}>Confirm password *</label>
                  <input type="password" placeholder="Repeat password" className="nx-input nx-input-sm" {...userForm.register('confirmPassword')} />
                  {userForm.formState.errors.confirmPassword && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{userForm.formState.errors.confirmPassword.message}</div>}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(0)} style={{ border: '1px solid var(--nx-border)', background: 'none', color: 'var(--nx-fg)', padding: '12px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                  ← Back
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 1, background: '#c44b1b', color: '#ffffff', border: 'none', padding: '12px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Registering…' : 'Create Account →'}
                </button>
              </div>
            </form>
          )}

          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', textAlign: 'center', marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/auth/login" style={{ color: '#c44b1b', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .reg-left-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
        .nx-input-sm { padding: 10px 12px !important; font-size: 14px !important; }
        .nx-select.nx-input-sm { padding: 10px 12px !important; font-size: 14px !important; }
      `}</style>
    </div>
  )
}
