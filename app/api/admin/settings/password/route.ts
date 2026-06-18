import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne, query } from '@/lib/db/aurora'
import bcrypt from 'bcryptjs'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const fd = await req.formData()
  const current = fd.get('current_password') as string
  const next = fd.get('new_password') as string
  const confirm = fd.get('confirm_password') as string

  if (!current || !next || !confirm) {
    return NextResponse.redirect(new URL('/admin/settings?error=missing', APP_URL))
  }

  if (next !== confirm) {
    return NextResponse.redirect(new URL('/admin/settings?error=mismatch', APP_URL))
  }

  if (next.length < 8) {
    return NextResponse.redirect(new URL('/admin/settings?error=short', APP_URL))
  }

  const user = await queryOne<{ id: string; password_hash: string }>(
    `SELECT id, password_hash FROM users WHERE id = $1`,
    [session.user.id]
  )

  if (!user) return NextResponse.redirect(new URL('/admin/settings?error=notfound', APP_URL))

  const valid = await bcrypt.compare(current, user.password_hash)
  if (!valid) return NextResponse.redirect(new URL('/admin/settings?error=wrong', APP_URL))

  const hash = await bcrypt.hash(next, 12)
  await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, user.id])

  return NextResponse.redirect(new URL('/admin/settings?success=1', APP_URL))
}
