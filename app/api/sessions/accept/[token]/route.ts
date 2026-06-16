import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { putSystemMessage } from '@/lib/db/dynamo'

interface Params { params: Promise<{ token: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params

  const row = await queryOne<{
    id: string
    status: string
    receiver_business_id: string
    created_at: Date
  }>(
    `SELECT id, status, receiver_business_id, created_at FROM sessions WHERE invitation_token = $1`,
    [token]
  )

  if (!row) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
  if (row.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used or expired' }, { status: 400 })
  }

  const createdAt = new Date(row.created_at)
  const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000)
  if (new Date() > expiresAt) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
  }

  if (row.receiver_business_id !== session.user.businessId) {
    return NextResponse.json({ error: 'This invitation is for a different business' }, { status: 403 })
  }

  await query(
    `UPDATE sessions SET status = 'active', receiver_agent_id = $1, accepted_at = NOW() WHERE id = $2`,
    [session.user.id, row.id]
  )

  await putSystemMessage(row.id, 'Session accepted. Both parties are now connected.', 'system')

  return NextResponse.json({ sessionId: row.id })
}
