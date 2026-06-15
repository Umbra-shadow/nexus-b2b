import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 })
  }

  await query(`UPDATE users SET name = $1 WHERE id = $2`, [name.trim(), session.user.id])
  return NextResponse.json({ success: true })
}
