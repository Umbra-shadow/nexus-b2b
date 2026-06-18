import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { sendVerificationResult, sendInfoRequest } from '@/lib/email/ses'

interface Params { params: Promise<{ id: string }> }

interface BizRow {
  id: string
  name: string
  verification_status: string
}
interface AdminRow {
  email: string
  name: string
}

function isAdmin(session: { user: { email?: string | null; role?: string } }) {
  return session.user.email === process.env.PLATFORM_ADMIN_EMAIL || session.user.role === 'system_admin'
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json() as { action: string; reason?: string; message?: string }
  const { action, reason, message } = body

  if (!['approve', 'reject', 'request_info'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const biz = await queryOne<BizRow>(`SELECT id, name, verification_status FROM businesses WHERE id = $1`, [id])
  if (!biz) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

  const adminUser = await queryOne<AdminRow>(
    `SELECT email, name FROM users WHERE business_id = $1 AND role = 'business_admin' LIMIT 1`,
    [id]
  )

  if (action === 'approve') {
    await query(`UPDATE businesses SET verification_status = 'verified' WHERE id = $1`, [id])
    if (adminUser) {
      try {
        await sendVerificationResult(adminUser.email, biz.name, true)
      } catch (e) {
        console.warn('[verify/approve] email failed:', e)
      }
    }
    return NextResponse.json({ success: true, status: 'verified' })
  }

  if (action === 'reject') {
    await query(`UPDATE businesses SET verification_status = 'rejected' WHERE id = $1`, [id])
    if (adminUser) {
      try {
        await sendVerificationResult(adminUser.email, biz.name, false, reason)
      } catch (e) {
        console.warn('[verify/reject] email failed:', e)
      }
    }
    return NextResponse.json({ success: true, status: 'rejected' })
  }

  if (action === 'request_info') {
    if (!message?.trim()) {
      return NextResponse.json({ error: 'A message is required when requesting information.' }, { status: 400 })
    }
    if (adminUser) {
      try {
        await sendInfoRequest(adminUser.email, adminUser.name, biz.name, message.trim())
      } catch (e) {
        console.warn('[verify/request_info] email failed:', e)
        return NextResponse.json({ error: 'Failed to send email. Please try again.' }, { status: 500 })
      }
    }
    return NextResponse.json({ success: true })
  }
}
