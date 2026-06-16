import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { generateToken } from '@/lib/auth/tokens'
import { sendSessionInvitation } from '@/lib/email/ses'
import { CreateSessionSchema } from '@/lib/validators'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const sessions = await query(
    `SELECT s.id, s.status, s.created_at, s.search_context, s.ai_introduced,
            ib.name as initiator_name, rb.name as receiver_name,
            s.initiator_business_id, s.receiver_business_id
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     WHERE s.initiator_business_id = $1 OR s.receiver_business_id = $1
     ORDER BY s.created_at DESC`,
    [session.user.businessId]
  )

  return NextResponse.json({ sessions })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreateSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 422 })
  }

  const { receiverBusinessId, searchContext } = parsed.data
  const initiatorBusinessId = session.user.businessId

  if (receiverBusinessId === initiatorBusinessId) {
    return NextResponse.json({ error: 'Cannot start a session with your own business' }, { status: 400 })
  }

  const receiverBusiness = await queryOne<{ id: string; name: string; description: string | null }>(
    `SELECT id, name, description FROM businesses WHERE id = $1 AND verification_status = 'verified'`,
    [receiverBusinessId]
  )
  if (!receiverBusiness) {
    return NextResponse.json({ error: 'Business not found or not verified' }, { status: 404 })
  }

  const existing = await queryOne(
    `SELECT id FROM sessions WHERE initiator_business_id = $1 AND receiver_business_id = $2 AND status != 'closed'`,
    [initiatorBusinessId, receiverBusinessId]
  )
  if (existing) {
    return NextResponse.json({ error: 'An active session already exists', sessionId: (existing as { id: string }).id }, { status: 409 })
  }

  const token = generateToken()

  const initiatorBusiness = await queryOne<{ name: string; description: string | null }>(
    `SELECT name, description FROM businesses WHERE id = $1`,
    [initiatorBusinessId]
  )

  // Check if receiver is a demo company (no registered users)
  const receiverAdmin = await queryOne<{ email: string }>(
    `SELECT email FROM users WHERE business_id = $1 AND role = 'business_admin' LIMIT 1`,
    [receiverBusinessId]
  )

  const isDemoReceiver = !receiverAdmin

  // Auto-accept sessions with demo companies so AI can reply immediately
  const [newSession] = await query<{ id: string }>(
    `INSERT INTO sessions
       (initiator_agent_id, initiator_business_id, receiver_business_id, invitation_token,
        search_context, invitation_sent_at, status, accepted_at)
     VALUES ($1, $2, $3, $4, $5, NOW(),
       ${isDemoReceiver ? "'active', NOW()" : "'pending', NULL"})
     RETURNING id`,
    [session.user.id, initiatorBusinessId, receiverBusinessId, token, searchContext ?? null]
  )

  if (!isDemoReceiver) {
    await sendSessionInvitation({
      to: receiverAdmin!.email,
      inviterBusinessName: initiatorBusiness?.name ?? 'A business',
      inviterDescription: initiatorBusiness?.description ?? '',
      receiverBusinessName: receiverBusiness.name,
      searchContext: searchContext ?? undefined,
      token,
    })
  }

  return NextResponse.json({ sessionId: newSession.id, isDemoSession: isDemoReceiver }, { status: 201 })
}
