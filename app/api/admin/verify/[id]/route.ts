import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { sendVerificationResult, sendInfoRequest } from '@/lib/email/ses'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const fd = await req.formData()
  const action = fd.get('action') as 'approve' | 'reject' | 'request_info'
  const reason = (fd.get('reason') as string) ?? undefined

  const biz = await queryOne<{ name: string; admin_email: string; admin_name: string }>(
    `SELECT b.name, u.email as admin_email, u.name as admin_name
     FROM businesses b
     JOIN users u ON u.business_id = b.id AND u.role = 'business_admin'
     WHERE b.id = $1`,
    [id]
  )

  if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  if (action === 'request_info') {
    // Send email to business admin requesting more information; don't change status
    try {
      await sendInfoRequest(biz.admin_email, biz.admin_name, biz.name, reason ?? '')
    } catch (err) {
      console.error('[admin/verify] Failed to send request_info email:', err)
    }
    return NextResponse.redirect(new URL('/admin/businesses', process.env.NEXT_PUBLIC_APP_URL!))
  }

  // approve or reject
  const status = action === 'approve' ? 'verified' : 'rejected'
  await query(`UPDATE businesses SET verification_status = $1 WHERE id = $2`, [status, id])

  try {
    await sendVerificationResult(biz.admin_email, biz.name, action === 'approve', reason)
  } catch (err) {
    console.error('[admin/verify] Failed to send verification result email:', err)
  }

  return NextResponse.redirect(new URL('/admin/businesses', process.env.NEXT_PUBLIC_APP_URL!))
}
