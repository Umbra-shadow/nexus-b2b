import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { putMessage } from '@/lib/db/dynamo'

interface Params { params: Promise<{ id: string }> }

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const receipt = await queryOne<{
    issuer_business_id: string
    receiver_business_id: string
    status: string
    total: string
    currency: string
    session_id: string
    issuer_name: string
    receiver_name: string
  }>(
    `SELECT r.issuer_business_id, r.receiver_business_id, r.status, r.total, r.currency, r.session_id,
            ib.name as issuer_name, rb.name as receiver_name
     FROM receipts r
     JOIN businesses ib ON ib.id = r.issuer_business_id
     JOIN businesses rb ON rb.id = r.receiver_business_id
     WHERE r.id = $1`,
    [id]
  )

  if (!receipt) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (receipt.issuer_business_id !== session.user.businessId) {
    return NextResponse.json({ error: 'Only the issuer can resend a receipt' }, { status: 403 })
  }
  if (receipt.status === 'acknowledged') {
    return NextResponse.json({ error: 'Receipt already acknowledged' }, { status: 400 })
  }

  // Re-post the chat notification so the counterpart sees it again
  await putMessage({
    session_id: receipt.session_id,
    sender_id: session.user.id,
    sender_name: session.user.name,
    sender_business: receipt.issuer_name,
    content: `📄 Receipt resent: ${receipt.currency} ${Number(receipt.total).toFixed(2)} from ${receipt.issuer_name} to ${receipt.receiver_name}. View receipt #${id.slice(0, 8)}`,
    type: 'receipt_ref',
    receipt_id: id,
  })

  // Email notification intentionally omitted — SES sandbox restrictions in demo mode

  return NextResponse.redirect(new URL(`/receipts/${id}`, process.env.NEXT_PUBLIC_APP_URL!))
}
