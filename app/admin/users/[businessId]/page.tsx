import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { formatDate } from '@/lib/utils'
import { DeleteUserButton } from '@/components/admin/DeleteButton'

export const metadata = { title: 'Business Members — System Admin' }

interface BizInfo {
  id: string
  name: string
  industry: string
  country: string
  city: string | null
  verification_status: string
}

interface MemberRow {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
  email_verified: boolean
  created_at: string
}

const ROLE_LABEL: Record<string, string> = {
  business_admin: 'Admin',
  business_agent: 'Agent',
  system_admin: 'System Admin',
}

const ROLE_COLOR: Record<string, string> = {
  business_admin: '#c44b1b',
  business_agent: 'var(--nx-muted)',
  system_admin: '#5a9a7a',
}

export default async function BusinessMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ businessId: string }>
  searchParams: Promise<{ added?: string; error?: string; verified?: string; resent?: string; resent_failed?: string }>
}) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const { businessId } = await params
  const sp = await searchParams

  const [biz, members] = await Promise.all([
    queryOne<BizInfo>(`SELECT id, name, industry, country, city, verification_status FROM businesses WHERE id = $1`, [businessId]),
    query<MemberRow>(`SELECT id, name, email, role, is_active, email_verified, created_at FROM users WHERE business_id = $1 ORDER BY role, name`, [businessId]),
  ])

  if (!biz) redirect('/admin/users')

  const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL

  return (
    <div style={{ padding: '36px 40px', animation: 'nx-rise 0.4s ease' }}>
      {/* Breadcrumb */}
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--nx-muted)', marginBottom: 20 }}>
        <Link href="/admin/users" style={{ color: '#c44b1b', textDecoration: 'none' }}>← Users</Link>
        {' / '}{biz.name}
      </div>

      {/* Flash messages */}
      {sp.added && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(90,154,122,0.08)', border: '1px solid rgba(90,154,122,0.3)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a9a7a', letterSpacing: '0.08em' }}>
          ✓ Member added and invitation email sent.
        </div>
      )}
      {sp.error === 'exists' && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(196,75,27,0.06)', border: '1px solid rgba(196,75,27,0.25)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c44b1b', letterSpacing: '0.08em' }}>
          ✗ A user with that email already exists.
        </div>
      )}
      {sp.error === 'missing' && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(196,75,27,0.06)', border: '1px solid rgba(196,75,27,0.25)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c44b1b', letterSpacing: '0.08em' }}>
          ✗ All fields are required.
        </div>
      )}
      {sp.verified && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(90,154,122,0.08)', border: '1px solid rgba(90,154,122,0.3)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a9a7a', letterSpacing: '0.08em' }}>
          ✓ Email marked as verified. The user can now log in.
        </div>
      )}
      {sp.resent && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(90,154,122,0.08)', border: '1px solid rgba(90,154,122,0.3)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#5a9a7a', letterSpacing: '0.08em' }}>
          ✓ Verification email resent. Note: may not deliver until the sending domain is verified on Resend.
        </div>
      )}
      {sp.resent_failed && (
        <div style={{ marginBottom: 20, padding: '12px 18px', background: 'rgba(196,75,27,0.06)', border: '1px solid rgba(196,75,27,0.25)', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#c44b1b', letterSpacing: '0.08em' }}>
          ✗ Could not resend verification email (Resend error). Use &quot;Mark verified&quot; instead to unblock the user.
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, lineHeight: 0.9, color: 'var(--nx-fg-strong)', textTransform: 'uppercase', marginBottom: 10 }}>
          {biz.name}
        </h1>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>
          {biz.industry} · {biz.country}{biz.city ? `, ${biz.city}` : ''} · {members.length} member{members.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Add Member form */}
      <details style={{ border: '1px solid var(--nx-border)', marginBottom: 32 }}>
        <summary style={{ padding: '16px 24px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#c44b1b', listStyle: 'none', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 16 }}>＋</span> Add Member to {biz.name}
        </summary>
        <form
          action="/api/admin/users/add"
          method="POST"
          style={{ padding: '20px 24px', borderTop: '1px solid var(--nx-border)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, alignItems: 'end', background: 'var(--nx-raised)' }}
        >
          <input type="hidden" name="business_id" value={businessId} />

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Full Name</span>
            <input name="name" required placeholder="Jane Smith" style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '10px 14px', outline: 'none' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Email</span>
            <input name="email" type="email" required placeholder="jane@company.com" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '10px 14px', outline: 'none' }} />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Role</span>
            <select name="role" className="nx-select" style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '10px 14px', outline: 'none' }}>
              <option value="business_agent">Agent</option>
              <option value="business_admin">Admin</option>
            </select>
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-muted)' }}>Temporary Password</span>
            <input name="temp_password" required placeholder="Min 8 characters" minLength={8} style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '10px 14px', outline: 'none' }} />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'transparent' }}>.</span>
            <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '11px 20px', border: 'none', color: '#fff', background: '#c44b1b', cursor: 'pointer' }}>
              Create &amp; Invite →
            </button>
          </div>

          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-muted)', fontStyle: 'italic', alignSelf: 'center', paddingTop: 20 }}>
            An invitation email with credentials will be sent to the user.
          </div>
        </form>
      </details>

      {/* Member list */}
      {members.length === 0 ? (
        <div style={{ border: '1px solid var(--nx-border)', padding: '48px 24px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--nx-muted)', fontStyle: 'italic' }}>
          No members yet. Add one above.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--nx-border)' }}>
          {members.map((u, i) => (
            <div
              key={u.id}
              style={{
                padding: '24px 28px',
                borderBottom: i < members.length - 1 ? '1px solid var(--nx-border)' : undefined,
                background: !u.is_active ? 'rgba(0,0,0,0.015)' : 'var(--nx-panel)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start' }}>
                {/* Left: identity */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: u.is_active ? 'var(--nx-fg-strong)' : 'var(--nx-muted)' }}>
                      {u.name}
                    </div>
                    {!u.is_active && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)' }}>
                        Inactive
                      </span>
                    )}
                    {!u.email_verified && (
                      <>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 8px', border: '1px solid rgba(196,75,27,0.3)', color: '#c44b1b' }}>
                          Email unverified
                        </span>
                        {/* Manual verify — unblocks the user immediately without needing email delivery */}
                        <form action={`/api/admin/users/${u.id}`} method="POST" style={{ display: 'inline' }}>
                          <input type="hidden" name="action" value="verify_email" />
                          <input type="hidden" name="redirectTo" value={`/admin/users/${businessId}`} />
                          <button type="submit" title="Mark email as verified without requiring the user to click a link" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', border: '1px solid rgba(90,154,122,0.4)', color: '#5a9a7a', background: 'rgba(90,154,122,0.06)', cursor: 'pointer' }}>
                            ✓ Mark verified
                          </button>
                        </form>
                        <form action={`/api/admin/users/${u.id}`} method="POST" style={{ display: 'inline' }}>
                          <input type="hidden" name="action" value="resend_verification" />
                          <input type="hidden" name="redirectTo" value={`/admin/users/${businessId}`} />
                          <button type="submit" title="Resend verification email to this user" style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '3px 10px', border: '1px solid var(--nx-border)', color: 'var(--nx-muted)', background: 'none', cursor: 'pointer' }}>
                            ↺ Resend email
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--nx-muted)', marginBottom: 10, letterSpacing: '0.04em' }}>
                    {u.email}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--nx-subtle)', letterSpacing: '0.06em' }}>
                    Joined {formatDate(u.created_at)}
                  </div>
                </div>

                {/* Right: role + actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-end', minWidth: 260 }}>
                  {/* Current role badge */}
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', border: `1px solid ${u.role === 'business_admin' ? 'rgba(196,75,27,0.4)' : u.role === 'system_admin' ? 'rgba(90,154,122,0.4)' : 'var(--nx-border)'}`, color: ROLE_COLOR[u.role] ?? 'var(--nx-muted)' }}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </div>

                  {/* Role change */}
                  {u.email !== PLATFORM_ADMIN_EMAIL && (
                    <form action={`/api/admin/users/${u.id}`} method="POST" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input type="hidden" name="action" value="change_role" />
                      <input type="hidden" name="redirectTo" value={`/admin/users/${businessId}`} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="nx-select"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--nx-fg)', background: 'var(--nx-bg)', border: '1px solid var(--nx-border)', padding: '7px 10px', outline: 'none' }}
                      >
                        <option value="business_agent">Agent</option>
                        <option value="business_admin">Admin</option>
                        <option value="system_admin">System Admin</option>
                      </select>
                      <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 14px', border: '1px solid var(--nx-border)', color: 'var(--nx-fg)', background: 'var(--nx-bg)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        Change →
                      </button>
                    </form>
                  )}

                  {/* Activate / Deactivate + Delete */}
                  {u.email !== PLATFORM_ADMIN_EMAIL ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <form action={`/api/admin/users/${u.id}`} method="POST">
                        <input type="hidden" name="action" value={u.is_active ? 'deactivate' : 'activate'} />
                        <input type="hidden" name="redirectTo" value={`/admin/users/${businessId}`} />
                        <button type="submit" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 14px', border: `1px solid ${u.is_active ? 'rgba(196,75,27,0.35)' : 'rgba(90,154,122,0.35)'}`, color: u.is_active ? '#c44b1b' : '#5a9a7a', background: u.is_active ? 'rgba(196,75,27,0.04)' : 'rgba(90,154,122,0.04)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          {u.is_active ? '⏸ Deactivate' : '▶ Activate'}
                        </button>
                      </form>
                      <DeleteUserButton id={u.id} name={u.name} businessId={businessId} />
                    </div>
                  ) : (
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#c44b1b', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Platform Owner</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
