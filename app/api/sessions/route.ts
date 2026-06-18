import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { generateToken } from '@/lib/auth/tokens'
import { sendSessionInvitation } from '@/lib/email/ses'
import { CreateSessionSchema } from '@/lib/validators'
import { generateIntroduction } from '@/lib/ai/v0'
import { putSystemMessage } from '@/lib/db/dynamo'

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

  const { receiverBusinessId, searchContext, selectedServices } = parsed.data
  const initiatorBusinessId = session.user.businessId

  if (receiverBusinessId === initiatorBusinessId) {
    return NextResponse.json({ error: 'Cannot start a session with your own business' }, { status: 400 })
  }

  const receiverBusiness = await queryOne<{ id: string; name: string; description: string | null; services: string[] | null }>(
    `SELECT id, name, description, services FROM businesses WHERE id = $1 AND verification_status = 'verified'`,
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

  const initiatorAgent = await queryOne<{ name: string }>(
    `SELECT name FROM users WHERE id = $1`,
    [session.user.id]
  )

  // Check if receiver is a demo company (no registered users)
  // Prefer the business contact_email for invitations; fall back to admin's personal email
  const receiverAdmin = await queryOne<{ email: string; contact_email: string | null }>(
    `SELECT u.email, b.contact_email
     FROM users u JOIN businesses b ON b.id = u.business_id
     WHERE u.business_id = $1 AND u.role = 'business_admin' LIMIT 1`,
    [receiverBusinessId]
  )

  const isDemoReceiver = !receiverAdmin

  // Auto-accept sessions with demo companies so AI can reply immediately
  const [newSession] = await query<{ id: string }>(
    `INSERT INTO sessions
       (initiator_agent_id, initiator_business_id, receiver_business_id, invitation_token,
        search_context, selected_services, invitation_sent_at, status, accepted_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(),
       ${isDemoReceiver ? "'active', NOW()" : "'pending', NULL"})
     RETURNING id`,
    [session.user.id, initiatorBusinessId, receiverBusinessId, token, searchContext ?? null, selectedServices ?? []]
  )

  if (isDemoReceiver) {
    // Fire Lummy intro immediately — both sides are already "connected" in demo mode
    const geminiKey = req.headers.get('x-gemini-key') || undefined
    const intro = await generateIntroduction({
      businessAName: initiatorBusiness?.name ?? 'the initiating company',
      businessADescription: initiatorBusiness?.description ?? '',
      agentAName: initiatorAgent?.name ?? session.user.name ?? 'their representative',
      businessBName: receiverBusiness.name,
      businessBDescription: receiverBusiness.description ?? '',
      agentBName: 'their team',
      searchContext: searchContext ?? undefined,
      selectedServices: selectedServices ?? [],
    }, geminiKey)
    await putSystemMessage(newSession.id, intro, 'ai_response')
    await query(`UPDATE sessions SET ai_introduced = true WHERE id = $1`, [newSession.id])
  } else {
    // Best-effort — session is already committed; don't fail the whole request over email
    try {
      await sendSessionInvitation({
        to: receiverAdmin!.contact_email ?? receiverAdmin!.email,
        inviterBusinessName: initiatorBusiness?.name ?? 'A business',
        inviterDescription: initiatorBusiness?.description ?? '',
        receiverBusinessName: receiverBusiness.name,
        searchContext: searchContext ?? undefined,
        token,
      })
    } catch (emailErr) {
      console.error('[sessions/create] invitation email failed (Resend sandbox?):', emailErr)
    }
  }

  return NextResponse.json({ sessionId: newSession.id, isDemoSession: isDemoReceiver }, { status: 201 })
}
