import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { putSystemMessage } from '@/lib/db/dynamo'
import { generateIntroduction } from '@/lib/ai/v0'

interface Params { params: Promise<{ token: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await params

  const row = await queryOne<{
    id: string
    status: string
    receiver_business_id: string
    initiator_business_id: string
    initiator_agent_id: string
    search_context: string | null
    selected_services: string[] | null
    created_at: Date
  }>(
    `SELECT id, status, receiver_business_id, initiator_business_id, initiator_agent_id,
            search_context, selected_services, created_at
     FROM sessions WHERE invitation_token = $1`,
    [token]
  )

  if (!row) return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 })
  if (row.status !== 'pending') {
    return NextResponse.json({ error: 'Invitation already used or expired' }, { status: 400 })
  }

  const createdAt = new Date(row.created_at)
  const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000) // 7 days
  if (new Date() > expiresAt) {
    return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 })
  }

  // Re-fetch business_id from DB to avoid stale JWT issues
  const userRecord = await queryOne<{ business_id: string | null }>(
    `SELECT business_id FROM users WHERE id = $1`,
    [session.user.id]
  )
  const userBusinessId = userRecord?.business_id ?? session.user.businessId

  if (row.receiver_business_id !== userBusinessId) {
    return NextResponse.json({ error: 'This invitation is for a different business' }, { status: 403 })
  }

  await query(
    `UPDATE sessions SET status = 'active', receiver_agent_id = $1, accepted_at = NOW() WHERE id = $2`,
    [session.user.id, row.id]
  )

  // Both parties are now connected — fire Lummy's intro
  const [initiatorBiz, receiverBiz, initiatorAgent] = await Promise.all([
    queryOne<{ name: string; description: string | null }>(
      `SELECT name, description FROM businesses WHERE id = $1`, [row.initiator_business_id]
    ),
    queryOne<{ name: string; description: string | null }>(
      `SELECT name, description FROM businesses WHERE id = $1`, [row.receiver_business_id]
    ),
    queryOne<{ name: string }>(
      `SELECT name FROM users WHERE id = $1`, [row.initiator_agent_id]
    ),
  ])

  const geminiKey = req.headers.get('x-gemini-key') || undefined
  const intro = await generateIntroduction({
    businessAName: initiatorBiz?.name ?? 'the initiating company',
    businessADescription: initiatorBiz?.description ?? '',
    agentAName: initiatorAgent?.name ?? 'their representative',
    businessBName: receiverBiz?.name ?? 'your company',
    businessBDescription: receiverBiz?.description ?? '',
    agentBName: session.user.name ?? 'their team',
    searchContext: row.search_context ?? undefined,
    selectedServices: row.selected_services ?? [],
  }, geminiKey)

  await putSystemMessage(row.id, intro, 'ai_response')
  await query(`UPDATE sessions SET ai_introduced = true WHERE id = $1`, [row.id])

  return NextResponse.json({ sessionId: row.id })
}
