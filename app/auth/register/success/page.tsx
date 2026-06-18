import Link from 'next/link'

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

export default function RegisterSuccessPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>

        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
          <NxMark />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, letterSpacing: '0.18em', color: 'var(--nx-fg-strong)' }}>
            NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
          </span>
        </Link>

        <div style={{ width: 52, height: 52, border: '2px solid #c44b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: '#c44b1b' }}>✉</span>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>/ Registration submitted</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)', marginBottom: 16 }}>CHECK YOUR EMAIL</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', lineHeight: 1.65, marginBottom: 28 }}>
          We&apos;ve sent a verification link to your email address. Click it to activate your account and sign in.
        </p>

        <div style={{ border: '1px solid var(--nx-border)', padding: '18px 20px', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--nx-subtle)', marginBottom: 12 }}>What happens next</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              'Click the verification link in your inbox (check spam if needed)',
              'Our team will review your business verification document',
              'Approved businesses appear in the discovery feed immediately',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', flexShrink: 0, marginTop: 1 }}>0{i + 1}</span>
                <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--nx-fg)', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <Link href="/auth/login" style={{ display: 'inline-block', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#ffffff', background: '#c44b1b', padding: '14px 28px', textDecoration: 'none' }}>
          Go to login →
        </Link>
      </div>
    </div>
  )
}
