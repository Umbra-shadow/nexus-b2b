import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne, transaction } from '@/lib/db/aurora'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const row = await queryOne<{
    status: string
    initiator_business_id: string
  }>(
    `SELECT status, initiator_business_id FROM sessions WHERE id = $1`,
    [id]
  )

  if (!row) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (row.status !== 'pending') {
    return NextResponse.json({ error: 'Only pending invitations can be cancelled' }, { status: 400 })
  }

  // Re-fetch businessId from DB to bypass any stale JWT
  const userRecord = await queryOne<{ business_id: string | null }>(
    `SELECT business_id FROM users WHERE id = $1`,
    [session.user.id]
  )
  const userBusinessId = userRecord?.business_id ?? session.user.businessId

  if (row.initiator_business_id !== userBusinessId) {
    return NextResponse.json({ error: 'Only the sender can cancel an invitation' }, { status: 403 })
  }

  // Pending sessions have no messages or receipts yet — safe to delete entirely
  await transaction(async (client) => {
    await client.query(`DELETE FROM receipts WHERE session_id = $1`, [id])
    await client.query(`DELETE FROM sessions WHERE id = $1`, [id])
  })

  return NextResponse.json({ success: true })
}
