import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { currentPassword, newPassword } = await req.json()

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (newPassword.length < 12) {
    return NextResponse.json({ error: 'New password must be at least 12 characters' }, { status: 400 })
  }

  const user = await queryOne<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1`,
    [session.user.id]
  )

  if (!user || !(await bcrypt.compare(currentPassword, user.password_hash))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const hash = await bcrypt.hash(newPassword, 12)
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, session.user.id])

  return NextResponse.json({ success: true })
}
