'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email('Enter a valid email'),
})
type FormData = z.infer<typeof Schema>

function NxLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 26, height: 26, position: 'relative', flexShrink: 0 }}>
        <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', top: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', top: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
        <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', bottom: 0, right: 0 }} />
        <div style={{ position: 'absolute', width: 1, height: 18, background: '#444', left: '50%', top: 4 }} />
        <div style={{ position: 'absolute', height: 1, width: 18, background: '#444', top: '50%', left: 4 }} />
      </div>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
        NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
      </span>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(Schema) })

  async function onSubmit(data: FormData) {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email }),
    })
    if (res.ok) {
      setSubmittedEmail(data.email)
      setSent(true)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        <div style={{ marginBottom: 40 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <NxLogo />
          </Link>
        </div>

        {!sent ? (
          <>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Reset password</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 10 }}>FORGOT YOUR PASSWORD?</h1>
              <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.65 }}>
                Enter the email address on your account and we&apos;ll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', display: 'block', marginBottom: 6 }}>
                  Work email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="nx-input nx-input-sm"
                  {...register('email')}
                />
                {errors.email && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{errors.email.message}</div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '14px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Sending…' : 'Send reset link →'}
              </button>
            </form>

          </>
        ) : (
          /* ── Sent confirmation ── */
          <div>
            <div style={{ width: 48, height: 48, border: '2px solid #c44b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#c44b1b' }}>✓</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Link sent</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 14 }}>CHECK YOUR INBOX</h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 32 }}>
              If an account exists for <strong style={{ color: 'var(--nx-fg-strong)' }}>{submittedEmail}</strong>, a password reset link has been sent. Check your spam folder if you don&apos;t see it within a few minutes.
            </p>
            <Link href="/auth/login" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 24px', textDecoration: 'none', display: 'inline-block' }}>
              ← Back to sign in
            </Link>
          </div>
        )}

        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', marginTop: 28 }}>
          Remember your password?{' '}
          <Link href="/auth/login" style={{ color: '#c44b1b', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>

      <style>{`
        .nx-input-sm { padding: 10px 12px !important; font-size: 14px !important; }
      `}</style>
    </div>
  )
}
