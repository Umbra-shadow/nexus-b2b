import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { sendSessionInvitation } from '@/lib/email/ses'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const row = await queryOne<{
    status: string
    invitation_token: string
    initiator_business_id: string
    receiver_business_id: string
    search_context: string | null
    ib_name: string
    ib_description: string | null
    rb_name: string
    receiver_email: string
    receiver_contact_email: string | null
  }>(
    `SELECT s.status, s.invitation_token, s.initiator_business_id, s.receiver_business_id,
            s.search_context,
            ib.name as ib_name, ib.description as ib_description,
            rb.name as rb_name,
            u.email as receiver_email, rb.contact_email as receiver_contact_email
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     JOIN users u ON u.business_id = rb.id AND u.role = 'business_admin'
     WHERE s.id = $1
     LIMIT 1`,
    [id]
  )

  if (!row) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (row.status !== 'pending') return NextResponse.json({ error: 'Session is no longer pending' }, { status: 400 })
  if (row.initiator_business_id !== session.user.businessId) {
    return NextResponse.json({ error: 'Only the initiator can resend the invitation' }, { status: 403 })
  }

  const primaryTo = row.receiver_contact_email ?? row.receiver_email
  const recipients = Array.from(new Set([primaryTo, row.receiver_email].filter(Boolean)))

  const results = await Promise.allSettled(
    recipients.map((to) =>
      sendSessionInvitation({
        to,
        inviterBusinessName: row.ib_name,
        inviterDescription: row.ib_description ?? '',
        receiverBusinessName: row.rb_name,
        searchContext: row.search_context ?? undefined,
        token: row.invitation_token,
      })
    )
  )

  const failed = results.filter((r) => r.status === 'rejected')
  if (failed.length === results.length) {
    const msg = (failed[0] as PromiseRejectedResult).reason instanceof Error
      ? (failed[0] as PromiseRejectedResult).reason.message
      : 'Email delivery failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
