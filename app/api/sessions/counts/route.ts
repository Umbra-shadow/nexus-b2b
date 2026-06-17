import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await queryOne<{ pending: string; unacknowledged: string }>(
    `SELECT
       (SELECT COUNT(*)::text FROM sessions
        WHERE (initiator_business_id = $1 OR receiver_business_id = $1) AND status = 'pending') AS pending,
       (SELECT COUNT(*)::text FROM receipts
        WHERE receiver_business_id = $1 AND status = 'sent') AS unacknowledged`,
    [session.user.businessId]
  )

  return NextResponse.json({
    pending: parseInt(row?.pending ?? '0'),
    unacknowledged: parseInt(row?.unacknowledged ?? '0'),
  })
}
