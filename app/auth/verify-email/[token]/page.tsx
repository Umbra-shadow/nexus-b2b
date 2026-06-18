import Link from 'next/link'
import { validateToken, markTokenUsed } from '@/lib/auth/tokens'
import { query } from '@/lib/db/aurora'

interface Props {
  params: Promise<{ token: string }>
}

function NxMark() {
  return (
    <div style={{ width: 26, height: 26, position: 'relative', flexShrink: 0 }}>
      <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', top: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', top: 0, right: 0 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, border: '1px solid #c44b1b', bottom: 0, left: 0 }} />
      <div style={{ position: 'absolute', width: 8, height: 8, background: '#c44b1b', bottom: 0, right: 0 }} />
    </div>
  )
}

export default async function VerifyEmailPage({ params }: Props) {
  const { token } = await params
  const result = await validateToken(token, 'email_verify')

  if (!result) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
            <NxMark />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
              NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
            </span>
          </Link>

          <div style={{ width: 52, height: 52, border: '2px solid rgba(196,75,27,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--nx-muted)' }}>✕</span>
          </div>

          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Verification failed</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 44, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 14 }}>LINK EXPIRED</h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 32 }}>
            This verification link has expired or already been used. Please request a new one from the login page.
          </p>
          <Link href="/auth/login" style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 28px', textDecoration: 'none' }}>
            ← Back to login
          </Link>
        </div>
      </div>
    )
  }

  await query(`UPDATE users SET email_verified = true WHERE id = $1`, [result.userId])
  await markTokenUsed(result.tokenId)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <NxMark />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
            NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
          </span>
        </Link>

        <div style={{ width: 52, height: 52, border: '2px solid #5a9a7a', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#5a9a7a' }}>✓</span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#5a9a7a', marginBottom: 10 }}>/ Email verified</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 16 }}>YOU&apos;RE VERIFIED</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 32 }}>
          Your email has been verified. Your business registration is now under review — we&apos;ll notify you once approved.
          You can sign in now.
        </p>

        <Link href="/auth/login" style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 28px', textDecoration: 'none' }}>
          Sign in →
        </Link>
      </div>
    </div>
  )
}
