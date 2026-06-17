import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { putMessage, getMessages, putSystemMessage } from '@/lib/db/dynamo'
import { generateDemoReply } from '@/lib/ai/v0'

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const row = await queryOne<{ initiator_business_id: string; receiver_business_id: string }>(
    `SELECT initiator_business_id, receiver_business_id FROM sessions WHERE id = $1`,
    [id]
  )
  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uid = session.user.businessId
  if (row.initiator_business_id !== uid && row.receiver_business_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const messages = await getMessages(id)
  return NextResponse.json({ messages })
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const sessionRow = await queryOne<{
    status: string
    ai_introduced: boolean
    initiator_business_id: string
    receiver_business_id: string
    search_context: string | null
    selected_services: string[] | null
    ib_name: string; ib_desc: string | null
    rb_name: string; rb_desc: string | null
    ia_name: string; ra_name: string | null
  }>(
    `SELECT s.status, s.ai_introduced, s.initiator_business_id, s.receiver_business_id,
            s.search_context, s.selected_services,
            ib.name as ib_name, ib.description as ib_desc,
            rb.name as rb_name, rb.description as rb_desc,
            ia.name as ia_name, ra.name as ra_name
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     JOIN users ia ON ia.id = s.initiator_agent_id
     LEFT JOIN users ra ON ra.id = s.receiver_agent_id
     WHERE s.id = $1`,
    [id]
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
    session_id: id,
    sender_id: session.user.id,
    sender_name: session.user.name,
    sender_business: uid === sessionRow.initiator_business_id ? sessionRow.ib_name : sessionRow.rb_name,
    content,
    type: 'text',
  })

  // Demo auto-reply: if receiver business has no users, AI replies on their behalf
  const isSenderInitiator = uid === sessionRow.initiator_business_id
  const receiverBizId = isSenderInitiator
    ? sessionRow.receiver_business_id
    : sessionRow.initiator_business_id

  const receiverHasUsers = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text as count FROM users WHERE business_id = $1`,
    [receiverBizId]
  )

  if (receiverHasUsers && parseInt(receiverHasUsers.count) === 0 && sessionRow.status === 'active') {
    const receiverBizName = isSenderInitiator ? sessionRow.rb_name : sessionRow.ib_name
    const receiverBizDesc = isSenderInitiator ? sessionRow.rb_desc : sessionRow.ib_desc
    const senderBizName = isSenderInitiator ? sessionRow.ib_name : sessionRow.rb_name

    const reply = await generateDemoReply(
      receiverBizName,
      receiverBizDesc ?? '',
      senderBizName,
      content,
      sessionRow.selected_services ?? []
    )

    await putMessage({
      session_id: id,
      sender_id: `demo:${receiverBizId}`,
      sender_name: `${receiverBizName} (Demo)`,
      sender_business: receiverBizName,
      content: reply,
      type: 'text',
    })

    await putSystemMessage(
      id,
      `⚠️ Demo mode: AI is representing ${receiverBizName}. In real life, a human would reply.`,
      'system'
    )
  }

  return NextResponse.json({ message: msg }, { status: 201 })
}
