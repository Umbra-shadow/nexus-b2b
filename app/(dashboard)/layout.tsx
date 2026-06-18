import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { EmailVerificationBanner } from '@/components/layout/EmailVerificationBanner'

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')
  if (session.user.role === 'system_admin') redirect('/admin')

  // Always read from DB so the banner disappears immediately after email verification
  // without requiring the user to re-login (JWT is refreshed separately via the jwt callback)
  const userRecord = await queryOne<{ email_verified: boolean }>(
    `SELECT email_verified FROM users WHERE id = $1`,
    [session.user.id]
  )
  const emailVerified = userRecord?.email_verified ?? session.user.emailVerified ?? false

  return (
    <DashboardLayout>
      {!emailVerified && <EmailVerificationBanner />}
      {children}
    </DashboardLayout>
  )
}
