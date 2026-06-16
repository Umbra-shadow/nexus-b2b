import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await queryOne<{ pending: string; unacknowledged: string }>(
    `SELECT
       COUNT(CASE WHEN (initiator_business_id = $1 OR receiver_business_id = $1) AND status = 'pending' THEN 1 END) AS pending,
       COUNT(CASE WHEN receiver_business_id = $1 AND status = 'sent' THEN 1 END) AS unacknowledged
     FROM sessions s
     LEFT JOIN receipts r ON r.receiver_business_id = $1 AND r.status = 'sent'
     WHERE s.initiator_business_id = $1 OR s.receiver_business_id = $1`,
    [session.user.businessId]
  )

  return NextResponse.json({
    pending: parseInt(row?.pending ?? '0'),
    unacknowledged: parseInt(row?.unacknowledged ?? '0'),
  })
}
