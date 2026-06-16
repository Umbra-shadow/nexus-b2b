import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { sendVerificationResult } from '@/lib/email/ses'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const fd = await req.formData()
  const action = fd.get('action') as 'approve' | 'reject'
  const reason = (fd.get('reason') as string) ?? undefined

  const biz = await queryOne<{ name: string; admin_email: string }>(
    `SELECT b.name, u.email as admin_email
     FROM businesses b
     JOIN users u ON u.business_id = b.id AND u.role = 'business_admin'
     WHERE b.id = $1`,
    [id]
  )

  if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const status = action === 'approve' ? 'verified' : 'rejected'
  await query(`UPDATE businesses SET verification_status = $1 WHERE id = $2`, [status, id])
  await sendVerificationResult(biz.admin_email, biz.name, action === 'approve', reason)

  return NextResponse.redirect(new URL('/admin', process.env.NEXT_PUBLIC_APP_URL!))
}
