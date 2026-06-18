import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { createVerificationToken } from '@/lib/auth/tokens'
import { sendTeamInvite } from '@/lib/email/ses'

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'business_admin') {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })
  }

  const { id } = await params

  // Ensure target member belongs to same business
  const member = await queryOne<{ id: string; business_id: string }>(
    `SELECT id, business_id FROM users WHERE id = $1`,
    [id]
  )

  if (!member || member.business_id !== session.user.businessId) {
    return NextResponse.json({ error: 'Member not found' }, { status: 404 })
  }

  if (member.id === session.user.id) {
    return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 })
  }

  const body = await req.json()

  if (body.action === 'resend_invite') {
    const target = await queryOne<{ email: string; name: string; email_verified: boolean }>(
      `SELECT email, name, email_verified FROM users WHERE id = $1 AND business_id = $2`,
      [id, session.user.businessId]
    )
    if (!target) return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    if (target.email_verified) return NextResponse.json({ error: 'Member has already accepted their invite' }, { status: 400 })

    const business = await queryOne<{ name: string }>(`SELECT name FROM businesses WHERE id = $1`, [session.user.businessId])
    const token = await createVerificationToken(id, 'invite', 48)

    try {
      await sendTeamInvite(target.email, session.user.name, business?.name ?? '', token)
    } catch (err) {
      console.error('[resend invite] email failed:', (err as Error).message)
      return NextResponse.json({ error: 'Failed to send email. The address may not be reachable.' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  const { isActive } = body
  await query(`UPDATE users SET is_active = $1 WHERE id = $2`, [Boolean(isActive), id])

  return NextResponse.json({ success: true })
}
