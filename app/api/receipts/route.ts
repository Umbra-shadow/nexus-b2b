import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { putMessage } from '@/lib/db/dynamo'
import { CreateReceiptSchema } from '@/lib/validators'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const receipts = await query(
    `SELECT r.id, r.status, r.total, r.currency, r.created_at,
            ib.name as issuer_name, rb.name as receiver_name
     FROM receipts r
     JOIN businesses ib ON ib.id = r.issuer_business_id
     JOIN businesses rb ON rb.id = r.receiver_business_id
     WHERE r.issuer_business_id = $1 OR r.receiver_business_id = $1
     ORDER BY r.created_at DESC`,
    [session.user.businessId]
  )

  return NextResponse.json({ receipts })
}

export async function POST(req: NextRequest) {
  try {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { sessionId, ...rest } = body

  const parsed = CreateReceiptSchema.safeParse(rest)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 422 })
  }

  if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })

  const sessionRow = await queryOne<{
    status: string
    initiator_business_id: string
    receiver_business_id: string
    ib_name: string
    rb_name: string
  }>(
    `SELECT s.status, s.initiator_business_id, s.receiver_business_id, ib.name as ib_name, rb.name as rb_name
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     WHERE s.id = $1`,
    [sessionId]
  )

  if (!sessionRow || sessionRow.status === 'closed') {
    return NextResponse.json({ error: 'Session not found or closed' }, { status: 404 })
  }

  const uid = session.user.businessId
  const isInitiator = uid === sessionRow.initiator_business_id
  if (!isInitiator && uid !== sessionRow.receiver_business_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const receiverBusinessId = isInitiator
    ? sessionRow.receiver_business_id
    : sessionRow.initiator_business_id

  const { items, currency, taxRate, notes } = parsed.data
  const itemsWithTotal = items.map((i) => ({ ...i, total: i.qty * i.unitPrice }))
  const subtotal = itemsWithTotal.reduce((sum, i) => sum + i.total, 0)
  const total = subtotal * (1 + taxRate)

  const [receipt] = await query<{ id: string }>(
    `INSERT INTO receipts (session_id, issuer_business_id, receiver_business_id, items, subtotal, tax_rate, total, currency, notes, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'sent')
     RETURNING id`,
    [sessionId, uid, receiverBusinessId, JSON.stringify(itemsWithTotal), subtotal, taxRate, total, currency, notes ?? null]
  )

  const myName = isInitiator ? sessionRow.ib_name : sessionRow.rb_name
  const theirName = isInitiator ? sessionRow.rb_name : sessionRow.ib_name

  await putMessage({
    session_id: sessionId,
    sender_id: session.user.id,
    sender_name: session.user.name,
    sender_business: myName,
    content: `📄 Receipt sent: ${currency} ${total.toFixed(2)} from ${myName} to ${theirName}. View receipt #${receipt.id.slice(0, 8)}`,
    type: 'receipt_ref',
    receipt_id: receipt.id,
  })

  return NextResponse.json({ receiptId: receipt.id }, { status: 201 })
  } catch (err) {
    console.error('[receipts POST]', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
