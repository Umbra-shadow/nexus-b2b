import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const receipt = await queryOne<{ receiver_business_id: string; status: string }>(
    `SELECT receiver_business_id, status FROM receipts WHERE id = $1`,
    [id]
  )

  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (receipt.receiver_business_id !== session.user.businessId) {
    return NextResponse.json({ error: 'Only the receiver can mark this as completed' }, { status: 403 })
  }
  // Accept both 'processed' (new flow) and 'sent' (legacy) so old receipts still work
  if (!['sent', 'processed', 'acknowledged'].includes(receipt.status)) {
    return NextResponse.json({ error: 'Receipt is already completed' }, { status: 400 })
  }

  await query(`UPDATE receipts SET status = 'completed' WHERE id = $1`, [id])
  return NextResponse.json({ success: true, status: 'completed' })
}
