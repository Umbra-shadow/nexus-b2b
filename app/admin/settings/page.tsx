import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'

export const metadata = { title: 'Settings — System Admin' }

const ERROR_MESSAGES: Record<string, string> = {
  missing: 'All fields are required.',
  mismatch: 'New passwords do not match.',
  short: 'New password must be at least 8 characters.',
  wrong: 'Current password is incorrect.',
  notfound: 'Account not found.',
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const { error, success } = await searchParams
  const name = session.user.name ?? ''
  const email = session.user.email ?? ''

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: '#c44b1b', marginBottom: 10 }}>
          / Settings
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 52, lineHeight: 0.9, color: 'var(--nx-fg-strong)' }}>
          ACCOUNT SETTINGS
        </h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 900 }}>
        {/* Profile info */}
        <div style={{ border: '1px solid var(--nx-border)', padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 20 }}>
            Profile
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 5 }}>Name</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-fg-strong)' }}>{name}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 5 }}>Email</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)' }}>{email}</div>
            </div>
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 5 }}>Role</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(196,75,27,0.4)', color: '#c44b1b' }}>
                System Admin
              </span>
            </div>
          </div>
        </div>

        {/* Change password */}
        <div style={{ border: '1px solid var(--nx-border)', padding: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 20 }}>
            Change Password
          </div>
          <form action="/api/admin/settings/password" method="POST" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Current Password</span>
              <input
                type="password"
                name="current_password"
                required
                autoComplete="current-password"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>New Password</span>
              <input
                type="password"
                name="new_password"
                required
                minLength={8}
                autoComplete="new-password"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Confirm New Password</span>
              <input
                type="password"
                name="confirm_password"
                required
                minLength={8}
                autoComplete="new-password"
                style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '9px 12px', outline: 'none' }}
              />
            </label>

            {error && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#c44b1b', border: '1px solid rgba(196,75,27,0.3)', background: 'rgba(196,75,27,0.05)', padding: '10px 14px', letterSpacing: '0.06em' }}>
                {ERROR_MESSAGES[error] ?? 'An error occurred.'}
              </div>
            )}
            {success && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: '#5a9a7a', border: '1px solid rgba(90,154,122,0.3)', background: 'rgba(90,154,122,0.05)', padding: '10px 14px', letterSpacing: '0.06em' }}>
                ✓ Password updated successfully.
              </div>
            )}

            <button
              type="submit"
              style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '10px 20px', border: '1px solid #c44b1b', color: '#fff', background: '#c44b1b', cursor: 'pointer', alignSelf: 'flex-start', marginTop: 4 }}
            >
              Update Password →
            </button>
          </form>
        </div>

        {/* Platform info */}
        <div style={{ border: '1px solid var(--nx-border)', padding: 24, gridColumn: '1 / -1' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--nx-fg)', marginBottom: 16 }}>
            Platform Configuration
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {[
              { label: 'App URL', value: process.env.NEXT_PUBLIC_APP_URL ?? '—' },
              { label: 'SES From', value: process.env.SES_FROM_EMAIL ?? '—' },
              { label: 'AWS Region', value: process.env.AWS_REGION ?? '—' },
            ].map((item) => (
              <div key={item.label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 5 }}>{item.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-fg)', letterSpacing: '0.04em', wordBreak: 'break-all' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
