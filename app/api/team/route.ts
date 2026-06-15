import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { createVerificationToken } from '@/lib/auth/tokens'
import { sendTeamInvite } from '@/lib/email/ses'
import { InviteTeamSchema } from '@/lib/validators'
import bcrypt from 'bcryptjs'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const members = await query(
    `SELECT id, name, email, role, is_active, created_at
     FROM users
     WHERE business_id = $1
     ORDER BY created_at ASC`,
    [session.user.businessId]
  )

  return NextResponse.json({ members })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'business_admin') {
    return NextResponse.json({ error: 'Only business admins can invite members' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = InviteTeamSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 422 })
  }

  const { name, email, role } = parsed.data

  const placeholder = await bcrypt.hash(require('crypto').randomBytes(32).toString('hex'), 12)

  const [newUser] = await query<{ id: string }>(
    `INSERT INTO users (business_id, email, name, password_hash, role, email_verified)
     VALUES ($1, $2, $3, $4, $5, false)
     RETURNING id`,
    [session.user.businessId, email, name, placeholder, role]
  )

  const business = await query<{ name: string }>(
    `SELECT name FROM businesses WHERE id = $1`,
    [session.user.businessId]
  )

  const token = await createVerificationToken(newUser.id, 'invite', 48)
  await sendTeamInvite(email, session.user.name, business[0]?.name ?? '', token)

  return NextResponse.json({ success: true }, { status: 201 })
}
