import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { sendChangeRequestNotification } from '@/lib/email/ses'

// GET — list own business's change requests
export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.businessId) return NextResponse.json({ requests: [] })

  const rows = await query<{
    id: string
    type: string
    status: string
    requested_at: string
    reviewed_at: string | null
    admin_note: string | null
    payload: Record<string, unknown>
    requester_name: string
  }>(
    `SELECT r.id, r.type, r.status, r.requested_at, r.reviewed_at, r.admin_note, r.payload,
            u.name as requester_name
     FROM business_change_requests r
     JOIN users u ON u.id = r.requested_by
     WHERE r.business_id = $1
     ORDER BY r.requested_at DESC
     LIMIT 50`,
    [session.user.businessId]
  )

  return NextResponse.json({ requests: rows })
}

// POST — submit a change request
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.businessId) return NextResponse.json({ error: 'No business' }, { status: 400 })

  const body = await req.json()
  const { type, payload } = body as { type: string; payload: Record<string, unknown> }

  if (!['update_info', 'delete_business'].includes(type)) {
    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 })
  }

  // Only business_admin can request deletions or info updates
  if (session.user.role !== 'business_admin') {
    return NextResponse.json({ error: 'Only business admins can submit change requests' }, { status: 403 })
  }

  // Check for existing pending request of same type
  const existing = await queryOne<{ id: string }>(
    `SELECT id FROM business_change_requests
     WHERE business_id = $1 AND type = $2 AND status = 'pending'`,
    [session.user.businessId, type]
  )
  if (existing) {
    return NextResponse.json({ error: 'You already have a pending request of this type. Please wait for it to be reviewed.' }, { status: 409 })
  }

  const row = await queryOne<{ id: string }>(
    `INSERT INTO business_change_requests (business_id, type, requested_by, payload)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [session.user.businessId, type, session.user.id, JSON.stringify(payload ?? {})]
  )

  // Notify platform admin — non-fatal
  queryOne<{ name: string; email: string; business_name: string }>(
    `SELECT u.name, u.email, b.name as business_name
     FROM users u
     JOIN businesses b ON b.id = $2
     WHERE u.id = $1`,
    [session.user.id, session.user.businessId]
  ).then((info) => {
    if (!info) return
    return sendChangeRequestNotification({
      type: type as 'update_info' | 'delete_business',
      requestId: row?.id ?? '',
      businessName: info.business_name,
      requesterName: info.name,
      requesterEmail: info.email,
    })
  }).catch((err) => console.error('[requests] admin notification failed:', err))

  return NextResponse.json({ id: row?.id }, { status: 201 })
}
