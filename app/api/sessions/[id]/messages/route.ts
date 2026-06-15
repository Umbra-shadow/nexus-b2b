import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { putMessage, getMessages } from '@/lib/db/dynamo'
import { generateIntroduction } from '@/lib/ai/gemini'
import { putSystemMessage } from '@/lib/db/dynamo'
import { query } from '@/lib/db/aurora'

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await queryOne<{ initiator_business_id: string; receiver_business_id: string }>(
    `SELECT initiator_business_id, receiver_business_id FROM sessions WHERE id = $1`,
    [params.id]
  )
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uid = session.user.businessId
  if (row.initiator_business_id !== uid && row.receiver_business_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await getMessages(params.id)
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessionRow = await queryOne<{
    status: string
    ai_introduced: boolean
    initiator_business_id: string
    receiver_business_id: string
    search_context: string | null
    ib_name: string; ib_desc: string | null
    rb_name: string; rb_desc: string | null
    ia_name: string; ra_name: string | null
  }>(
    `SELECT s.status, s.ai_introduced, s.initiator_business_id, s.receiver_business_id, s.search_context,
            ib.name as ib_name, ib.description as ib_desc,
            rb.name as rb_name, rb.description as rb_desc,
            ia.name as ia_name, ra.name as ra_name
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     JOIN users ia ON ia.id = s.initiator_agent_id
     LEFT JOIN users ra ON ra.id = s.receiver_agent_id
     WHERE s.id = $1`,
    [params.id]
  )

  if (!sessionRow) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (sessionRow.status === 'closed') {
    return NextResponse.json({ error: 'Session is closed' }, { status: 400 })
  }

  const uid = session.user.businessId
  if (sessionRow.initiator_business_id !== uid && sessionRow.receiver_business_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const content = (body.content ?? '').trim()
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 })

  const msg = await putMessage({
    session_id: params.id,
    sender_id: session.user.id,
    sender_name: session.user.name,
    sender_business: uid === sessionRow.initiator_business_id ? sessionRow.ib_name : sessionRow.rb_name,
    content,
    type: 'text',
  })

  // Fire AI introduction once when session becomes active and first message is sent
  if (!sessionRow.ai_introduced && sessionRow.status === 'active') {
    const intro = await generateIntroduction({
      businessAName: sessionRow.ib_name,
      businessADescription: sessionRow.ib_desc ?? '',
      agentAName: sessionRow.ia_name,
      businessBName: sessionRow.rb_name,
      businessBDescription: sessionRow.rb_desc ?? '',
      agentBName: sessionRow.ra_name ?? 'their team',
      searchContext: sessionRow.search_context ?? undefined,
    })

    await putSystemMessage(params.id, intro, 'ai_response')
    await query(`UPDATE sessions SET ai_introduced = true WHERE id = $1`, [params.id])
  }

  return NextResponse.json({ message: msg }, { status: 201 })
}
