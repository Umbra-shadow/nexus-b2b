import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { putSystemMessage } from '@/lib/db/dynamo'

interface Params { params: { id: string } }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await queryOne<{ status: string; initiator_business_id: string; receiver_business_id: string }>(
    `SELECT status, initiator_business_id, receiver_business_id FROM sessions WHERE id = $1`,
    [params.id]
  )

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (row.status === 'closed') return NextResponse.json({ error: 'Already closed' }, { status: 400 })

  const uid = session.user.businessId
  if (row.initiator_business_id !== uid && row.receiver_business_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await query(`UPDATE sessions SET status = 'closed', closed_at = NOW() WHERE id = $1`, [params.id])
  await putSystemMessage(
    params.id,
    `Session closed by ${session.user.name}. This conversation has ended.`,
    'system'
  )

  return NextResponse.json({ success: true })
}
