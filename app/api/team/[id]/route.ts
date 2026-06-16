import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'

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

  const { isActive } = await req.json()
  await query(`UPDATE users SET is_active = $1 WHERE id = $2`, [Boolean(isActive), id])

  return NextResponse.json({ success: true })
}
