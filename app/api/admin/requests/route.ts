import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const statusFilter = searchParams.get('status') ?? 'pending'

  const rows = await query<{
    id: string
    business_id: string
    business_name: string
    type: string
    status: string
    requested_at: string
    reviewed_at: string | null
    admin_note: string | null
    payload: Record<string, unknown>
    requester_name: string
    requester_email: string
  }>(
    `SELECT r.id, r.business_id, b.name as business_name,
            r.type, r.status, r.requested_at, r.reviewed_at, r.admin_note, r.payload,
            u.name as requester_name, u.email as requester_email
     FROM business_change_requests r
     JOIN businesses b ON b.id = r.business_id
     JOIN users u ON u.id = r.requested_by
     WHERE ($1 = 'all' OR r.status = $1)
     ORDER BY r.requested_at DESC
     LIMIT 200`,
    [statusFilter]
  )

  return NextResponse.json({ requests: rows })
}
