import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'

export async function DELETE(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email === 'admin@meridian.io') {
    return NextResponse.json(
      { error: 'This account is protected for the live demo and cannot be deleted.' },
      { status: 403 }
    )
  }
  // Soft-delete: deactivate the account so all messages and session history are preserved
  await query(`UPDATE users SET is_active = false WHERE id = $1`, [session.user.id])
  return NextResponse.json({ success: true })
}

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await queryOne(
    `SELECT id, email, name, role, phone, linkedin_url, whatsapp, is_active, email_verified, created_at
     FROM users WHERE id = $1`,
    [session.user.id]
  )
  return NextResponse.json({ user })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, phone, linkedin_url, whatsapp } = body

  if (name !== undefined) {
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
    }
  }

  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (name !== undefined) { sets.push(`name = $${idx++}`); params.push(name.trim()) }
  if (phone !== undefined) { sets.push(`phone = $${idx++}`); params.push(phone?.trim() || null) }
  if (linkedin_url !== undefined) { sets.push(`linkedin_url = $${idx++}`); params.push(linkedin_url?.trim() || null) }
  if (whatsapp !== undefined) { sets.push(`whatsapp = $${idx++}`); params.push(whatsapp?.trim() || null) }

  if (sets.length === 0) return NextResponse.json({ success: true })

  params.push(session.user.id)
  await query(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, params)
  return NextResponse.json({ success: true })
}
