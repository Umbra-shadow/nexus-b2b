import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { DashboardLayout } from '@/components/layout/DashboardLayout'

export default async function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  return <DashboardLayout>{children}</DashboardLayout>
}
