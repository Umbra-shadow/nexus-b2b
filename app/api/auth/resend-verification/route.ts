import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { createVerificationToken } from '@/lib/auth/tokens'
import { sendVerificationEmail } from '@/lib/email/ses'

export async function POST() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (session.user.emailVerified) {
    return NextResponse.json({ error: 'Email is already verified.' }, { status: 400 })
  }

  const user = await queryOne<{ id: string; name: string; email: string }>(
    `SELECT id, name, email FROM users WHERE id = $1`,
    [session.user.id]
  )
  if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 })

  const token = await createVerificationToken(user.id, 'email_verify', 48)

  try {
    await sendVerificationEmail(user.email, user.name, token)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to send email: ${msg}` }, { status: 500 })
  }
}
