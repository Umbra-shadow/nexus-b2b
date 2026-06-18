import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { sendVerificationEmail } from '@/lib/email/ses'
import { createVerificationToken } from '@/lib/auth/tokens'

interface Params { params: Promise<{ id: string }> }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const fd = await req.formData()
  const action = fd.get('action') as string
  const redirectTo = (fd.get('redirectTo') as string) || '/admin/users'

  if (action === 'activate') {
    await query(`UPDATE users SET is_active = true WHERE id = $1`, [id])
  } else if (action === 'deactivate') {
    await query(`UPDATE users SET is_active = false WHERE id = $1`, [id])
  } else if (action === 'delete') {
    await query(`DELETE FROM users WHERE id = $1`, [id])
  } else if (action === 'change_role') {
    const role = fd.get('role') as string
    if (!['business_admin', 'business_agent', 'system_admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    await query(`UPDATE users SET role = $1::user_role WHERE id = $2`, [role, id])
  } else if (action === 'verify_email') {
    await query(`UPDATE users SET email_verified = true WHERE id = $1`, [id])
    await query(`DELETE FROM verification_tokens WHERE user_id = $1 AND type = 'email_verify'`, [id])
    return NextResponse.redirect(new URL(redirectTo + '?verified=1', APP_URL))
  } else if (action === 'resend_verification') {
    const user = await queryOne<{ email: string; name: string }>(
      `SELECT email, name FROM users WHERE id = $1`, [id]
    )
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    await query(`DELETE FROM verification_tokens WHERE user_id = $1 AND type = 'email_verify'`, [id])
    const token = await createVerificationToken(id, 'email_verify')
    try {
      await sendVerificationEmail(user.email, user.name, token)
      return NextResponse.redirect(new URL(redirectTo + '?resent=1', APP_URL))
    } catch {
      return NextResponse.redirect(new URL(redirectTo + '?resent_failed=1', APP_URL))
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.redirect(new URL(redirectTo, APP_URL))
}
