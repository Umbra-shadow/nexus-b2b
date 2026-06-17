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

  // Check for existing email first to return a clear error
  const existing = await query<{ id: string }>(
    `SELECT id FROM users WHERE email = $1`,
    [email]
  )
  if (existing.length > 0) {
    return NextResponse.json({ error: 'A user with this email already exists.' }, { status: 409 })
  }

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

  // Email is best-effort — SES sandbox may reject unverified addresses
  let emailSent = true
  try {
    await sendTeamInvite(email, session.user.name, business[0]?.name ?? '', token)
  } catch (err) {
    emailSent = false
    console.warn('[team invite] email failed (SES sandbox?):', (err as Error).message)
  }

  return NextResponse.json({ success: true, emailSent }, { status: 201 })
}
