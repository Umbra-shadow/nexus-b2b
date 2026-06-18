import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { sendTestEmail } from '@/lib/email/ses'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as { to?: string }
  const to = (body.to ?? '').trim()
  if (!to || !to.includes('@')) {
    return NextResponse.json({ error: 'A valid recipient email is required' }, { status: 400 })
  }

  try {
    const result = await sendTestEmail(to)
    return NextResponse.json({ success: true, ...result })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[test-email]', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
