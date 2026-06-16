import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { answerQuery } from '@/lib/ai/v0'
import { putMessage } from '@/lib/db/dynamo'
import { AIQuerySchema } from '@/lib/validators'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = AIQuerySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 422 })
  }

  const { question, sessionId } = parsed.data

  const row = await queryOne<{ status: string; initiator_business_id: string; receiver_business_id: string }>(
    `SELECT status, initiator_business_id, receiver_business_id FROM sessions WHERE id = $1`,
    [sessionId]
  )

  if (!row || row.status === 'closed') {
    return NextResponse.json({ error: 'Session not found or closed' }, { status: 404 })
  }

  const uid = session.user.businessId
  if (row.initiator_business_id !== uid && row.receiver_business_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const answer = await answerQuery(question)

  await putMessage({
    session_id: sessionId,
    sender_id: 'ai',
    sender_name: 'NexusB2B AI',
    sender_business: 'NexusB2B',
    content: answer,
    type: 'ai_response',
  })

  return NextResponse.json({ answer })
}
