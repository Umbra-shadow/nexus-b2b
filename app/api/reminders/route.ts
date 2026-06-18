import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await query<{
    id: string
    title: string
    note: string | null
    remind_at: string
    user_name: string
  }>(
    `SELECT r.id, r.title, r.note, r.remind_at::text, u.name as user_name
     FROM reminders r
     JOIN users u ON u.id = r.user_id
     WHERE r.business_id = $1
     ORDER BY r.remind_at ASC`,
    [session.user.businessId]
  )

  return NextResponse.json(rows)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { title, note, remind_at } = await req.json()
  if (!title?.trim() || !remind_at) {
    return NextResponse.json({ error: 'Title and date are required' }, { status: 400 })
  }

  const row = await query<{ id: string }>(
    `INSERT INTO reminders (business_id, user_id, title, note, remind_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [session.user.businessId, session.user.id, title.trim(), note?.trim() || null, remind_at]
  )

  return NextResponse.json(row[0], { status: 201 })
}
