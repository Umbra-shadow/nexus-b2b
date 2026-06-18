import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const receipt = await queryOne<{ issuer_business_id: string; status: string }>(
    `SELECT issuer_business_id, status FROM receipts WHERE id = $1`,
    [id]
  )

  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (receipt.issuer_business_id !== session.user.businessId) {
    return NextResponse.json({ error: 'Only the issuer can mark this as processed' }, { status: 403 })
  }
  if (receipt.status !== 'sent') {
    return NextResponse.json({ error: 'Receipt is not in a state that can be processed' }, { status: 400 })
  }

  await query(`UPDATE receipts SET status = 'processed' WHERE id = $1`, [id])
  return NextResponse.json({ success: true, status: 'processed' })
}
