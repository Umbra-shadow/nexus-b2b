import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import Link from 'next/link'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { IndustryBadge } from '@/components/shared/IndustryBadge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export const metadata = { title: 'Admin — NexusB2B' }

interface PendingBusiness {
  id: string
  name: string
  slug: string
  industry: string
  country: string
  city: string | null
  description: string | null
  website: string | null
  created_at: string
  admin_email: string
  admin_name: string
}

export default async function AdminPage() {
  const session = await auth()
  if (!session?.user) redirect('/auth/login')

  const PLATFORM_ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL
  if (session.user.email !== PLATFORM_ADMIN_EMAIL) redirect('/dashboard')

  const [pending, stats] = await Promise.all([
    query<PendingBusiness>(
      `SELECT b.id, b.name, b.slug, b.industry, b.country, b.city, b.description, b.website, b.created_at,
              u.email as admin_email, u.name as admin_name
       FROM businesses b
       JOIN users u ON u.business_id = b.id AND u.role = 'business_admin'
       WHERE b.verification_status = 'pending'
       ORDER BY b.created_at ASC`
    ),
    query<{ total_businesses: string; total_users: string; total_sessions: string }>(
      `SELECT
         (SELECT COUNT(*) FROM businesses) as total_businesses,
         (SELECT COUNT(*) FROM users) as total_users,
         (SELECT COUNT(*) FROM sessions) as total_sessions`
    ),
  ])

  const s = stats[0]

  return (
    <div className="min-h-screen bg-secondary">
      <div className="container-app py-8 space-y-8">
        <div>
          <h1 className="text-heading text-foreground">Platform Admin</h1>
          <p className="text-muted-foreground mt-1">NexusB2B operations dashboard</p>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Businesses', value: s?.total_businesses ?? 0 },
            { label: 'Users', value: s?.total_users ?? 0 },
            { label: 'Sessions', value: s?.total_sessions ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="card-base text-center">
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Verification queue */}
        <div className="card-base">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-5 h-5 text-orange-500" />
            <h2 className="font-semibold text-foreground">
              Verification Queue ({pending.length})
            </h2>
          </div>

          {pending.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
              All caught up — no pending verifications.
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((biz) => (
                <div key={biz.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <Avatar name={biz.name} size="md" />
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-foreground">{biz.name}</p>
                          <IndustryBadge industry={biz.industry as never} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {[biz.city, biz.country].filter(Boolean).join(', ')} ·{' '}
                          {biz.website && (
                            <a href={biz.website} target="_blank" rel="noopener noreferrer" className="text-brand-brown hover:underline">
                              {biz.website}
                            </a>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Admin: {biz.admin_name} &lt;{biz.admin_email}&gt; · Registered {formatDate(biz.created_at)}
                        </p>
                        {biz.description && (
                          <p className="text-sm text-muted-foreground mt-2">{biz.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <form action={`/api/admin/verify/${biz.id}`} method="POST">
                        <input type="hidden" name="action" value="approve" />
                        <Button type="submit" size="sm" className="gap-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                      </form>
                      <form action={`/api/admin/verify/${biz.id}`} method="POST">
                        <input type="hidden" name="action" value="reject" />
                        <Button type="submit" size="sm" variant="destructive" className="gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
