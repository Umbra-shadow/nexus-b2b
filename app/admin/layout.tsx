import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { AdminNav } from '@/components/admin/AdminNav'
import { AdminTopBar } from '@/components/admin/AdminTopBar'

export const metadata = { title: 'System Admin — NexusB2B' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') redirect('/dashboard')

  const adminEmail = session.user.email ?? ''
  const adminName = session.user.name ?? 'System Admin'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--nx-bg)' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, flexShrink: 0, background: 'var(--nx-raised)', borderRight: '1px solid var(--nx-border)', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0 }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--nx-border)' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, letterSpacing: '0.14em', color: 'var(--nx-fg-strong)', lineHeight: 1, marginBottom: 6 }}>
            NEXUS<span style={{ color: '#c44b1b' }}>B2B</span>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#c44b1b' }}>
            System Admin
          </div>
        </div>

        {/* Nav */}
        <AdminNav />

        {/* Bottom: identity */}
        <div style={{ borderTop: '1px solid var(--nx-border)', padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: 13, color: 'var(--nx-fg-strong)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adminName}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--nx-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {adminEmail}
          </div>
        </div>
      </aside>

      {/* Right column: topbar + content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AdminTopBar />
        <main style={{ flex: 1, overflowY: 'auto', background: 'var(--nx-panel)' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
