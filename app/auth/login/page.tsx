'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, getSession } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { LoginSchema } from '@/lib/validators'
import type { z } from 'zod'

type LoginFormData = z.infer<typeof LoginSchema>

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

const TESTIMONIALS = [
  { text: 'Every contact here has been vetted. That changes the whole conversation.', from: 'CFO, Stonebridge Capital' },
  { text: 'We closed three distribution deals in our first month.', from: 'COO, Aurora Textiles' },
  { text: 'The AI-mediated intro saved us two weeks of back-and-forth.', from: 'BD Lead, Cobalt Cloud' },
]

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [quoteIdx] = useState(() => Math.floor(Date.now() / 60000) % TESTIMONIALS.length)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({ resolver: zodResolver(LoginSchema) })

  function fillDemo(email: string, password: string) {
    setValue('email', email)
    setValue('password', password)
  }

  async function onSubmit(data: LoginFormData) {
    setServerError(null)
    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError('Invalid email or password. Please check your credentials.')
      return
    }

    const session = await getSession()
    if ((session?.user as { role?: string })?.role === 'system_admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  const q = TESTIMONIALS[quoteIdx]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', position: 'relative' }}>

      {/* Left brand panel — shown on lg+ */}
      <div
        className="lg-panel"
        style={{
          display: 'none',
          flex: '0 0 620px',
          background: 'var(--nx-raised)',
          borderRight: '1px solid var(--nx-border)',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '56px 52px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative grid bg */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--nx-border) 1px, transparent 1px), linear-gradient(90deg, var(--nx-border) 1px, transparent 1px)', backgroundSize: '48px 48px', opacity: 0.35, pointerEvents: 'none' }} />

        <div style={{ position: 'relative' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <NxLogo />
          </Link>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 20 }}>/ The verified deal network</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(64px,6vw,88px)', lineHeight: 0.86, color: 'var(--nx-fg-strong)', marginBottom: 28 }}>
            THE<br />DEAL<br />ROOM.
          </h2>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, lineHeight: 1.75, color: 'var(--nx-muted)', marginBottom: 40, maxWidth: 380 }}>
            Every business on NexusB2B is identity-verified before they appear in search. Deals happen in structured sessions with AI-mediated introductions and signed receipts — no cold email, no guesswork.
          </p>

          {/* Stat strip */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: '1px solid var(--nx-border)', borderBottom: '1px solid var(--nx-border)', paddingTop: 20, paddingBottom: 20, marginBottom: 36, gap: 0 }}>
            <div style={{ borderRight: '1px solid var(--nx-border)', paddingRight: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>2,400+</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>Verified firms</div>
            </div>
            <div style={{ borderRight: '1px solid var(--nx-border)', paddingLeft: 20, paddingRight: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>38</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>Countries</div>
            </div>
            <div style={{ paddingLeft: 20 }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, lineHeight: 0.9, color: '#c44b1b' }}>€140M</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginTop: 6 }}>In sessions</div>
            </div>
          </div>

          {/* Testimonial */}
          <div style={{ border: '1px solid var(--nx-border)', padding: '20px 22px' }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, lineHeight: 1.6, color: 'var(--nx-fg)', fontStyle: 'italic', marginBottom: 10 }}>
              &ldquo;{q.text}&rdquo;
            </p>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>— {q.from}</div>
          </div>
        </div>

        <div style={{ position: 'relative', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-subtle)' }}>
          © 2026 NexusB2B
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>

        {/* Back to home — top-right of right panel */}
        <div style={{ position: 'absolute', top: 24, right: 24 }}>
          <Link href="/" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', textDecoration: 'none', border: '1px solid var(--nx-border)', padding: '7px 12px', display: 'inline-block' }}>
            ← Home
          </Link>
        </div>

        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo on mobile only */}
          <div style={{ marginBottom: 40 }} className="mobile-logo">
            <Link href="/" style={{ textDecoration: 'none' }}>
              <NxLogo />
            </Link>
          </div>

          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Sign in</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 8 }}>WELCOME BACK</h1>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-muted)' }}>Sign in to your business account</p>
          </div>

          {/* Demo accounts */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 8 }}>
              Demo accounts — click to fill
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Business Admin */}
              <button
                type="button"
                onClick={() => fillDemo('admin@meridian.io', 'demo1234')}
                style={{ width: '100%', border: '1px solid var(--nx-border)', background: 'var(--nx-raised)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5a9a7a', border: '1px solid rgba(90,154,122,0.4)', padding: '2px 6px' }}>Business Admin</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-fg-strong)' }}>admin@meridian.io</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', marginTop: 2 }}>Meridian Logistics Group · password: demo1234</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-muted)', flexShrink: 0, marginLeft: 12 }}>→</span>
              </button>

              {/* System Admin */}
              <button
                type="button"
                onClick={() => fillDemo('admin@nexusb2b.io', 'admin1234')}
                style={{ width: '100%', border: '1px solid rgba(196,75,27,0.3)', background: 'rgba(196,75,27,0.04)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#c44b1b', border: '1px solid rgba(196,75,27,0.4)', padding: '2px 6px' }}>System Admin</span>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-fg-strong)' }}>admin@nexusb2b.io</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--nx-muted)', marginTop: 2 }}>Platform operations · password: admin1234</div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', flexShrink: 0, marginLeft: 12 }}>→</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {serverError && (
              <div style={{ border: '1px solid #7a2a0c', background: 'rgba(196,75,27,0.08)', padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#e07050' }}>
                {serverError}
              </div>
            )}

            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', display: 'block', marginBottom: 6 }}>Work email</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                className="nx-input nx-input-sm"
                {...register('email')}
              />
              {errors.email && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{errors.email.message}</div>}
            </div>

            <div>
              <label style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-muted)', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  className="nx-input nx-input-sm"
                  style={{ paddingRight: 40 }}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nx-muted)', padding: 0, lineHeight: 0 }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', marginTop: 4 }}>{errors.password.message}</div>}
              {/* Forgot — below the field */}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Link href="/auth/reset-password" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', color: '#b84040', textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{ background: '#c44b1b', color: '#ffffff', border: 'none', padding: '14px 24px', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1, marginTop: 6 }}
            >
              {isSubmitting ? 'Signing in…' : 'Sign in →'}
            </button>
          </form>

          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-muted)', textAlign: 'center', marginTop: 24 }}>
            No account?{' '}
            <Link href="/auth/register" style={{ color: '#c44b1b', textDecoration: 'none' }}>Register your business</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (min-width: 1024px) {
          .lg-panel { display: flex !important; }
          .mobile-logo { display: none !important; }
        }
        .nx-input-sm { padding: 10px 12px !important; font-size: 14px !important; }
      `}</style>
    </div>
  )
}
