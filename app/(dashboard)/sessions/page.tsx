import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import Link from 'next/link'
import { MessageSquare, ArrowRight } from 'lucide-react'
import { StatusPill } from '@/components/shared/StatusPill'
import { Avatar } from '@/components/shared/Avatar'
import { formatDateTime } from '@/lib/utils'
import type { SessionStatus } from '@/types/session'

export const metadata = { title: 'Sessions' }

interface SessionRow {
  id: string
  status: SessionStatus
  created_at: string
  accepted_at: string | null
  other_business_name: string
  other_business_slug: string
  other_business_logo: string | null
}

export default async function SessionsPage() {
  const session = await auth()
  const user = session!.user

  const sessions = await query<SessionRow>(
    `SELECT
       s.id, s.status, s.created_at, s.accepted_at,
       CASE
         WHEN s.initiator_business_id = $2 THEN rb.name
         ELSE ib.name
       END as other_business_name,
       CASE
         WHEN s.initiator_business_id = $2 THEN rb.slug
         ELSE ib.slug
       END as other_business_slug,
       CASE
         WHEN s.initiator_business_id = $2 THEN rb.logo_s3_key
         ELSE ib.logo_s3_key
       END as other_business_logo
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     WHERE s.initiator_agent_id = $1
        OR s.receiver_agent_id = $1
        OR s.initiator_business_id = $2
        OR s.receiver_business_id = $2
     ORDER BY s.created_at DESC`,
    [user.id, user.businessId]
  )

  return (
    <div className="container-app py-8 space-y-6">
      <div>
        <h1 className="text-heading text-foreground">Sessions</h1>
        <p className="text-muted-foreground mt-1">Your deal conversations</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-20">
          <MessageSquare className="w-10 h-10 mx-auto mb-4 text-muted-foreground opacity-30" />
          <p className="text-muted-foreground">No sessions yet.</p>
          <Link href="/discovery" className="text-brand-brown hover:underline text-sm mt-2 inline-block">
            Find a business to connect with →
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <Link
              key={s.id}
              href={`/sessions/${s.id}`}
              className="card-base flex items-center gap-4 hover:shadow-md transition-shadow group"
            >
              <Avatar name={s.other_business_name} src={null} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground group-hover:text-brand-brown transition-colors truncate">
                  {s.other_business_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatDateTime(s.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusPill status={s.status} />
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-brand-brown transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
