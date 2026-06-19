import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db/aurora'
import { createVerificationToken } from '@/lib/auth/tokens'
import { sendVerificationEmail } from '@/lib/email/ses'

// Public endpoint — no auth required.
// Accepts an email, creates a fresh 7-day token, and sends a new verification email.
// Always returns 200 so we don't leak whether the email exists.
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ ok: true }) // silent
    }

    const user = await queryOne<{ id: string; name: string; email_verified: boolean }>(
      `SELECT id, name, email_verified FROM users WHERE email = $1 AND is_active = true`,
      [email.toLowerCase().trim()]
    )

    // If not found or already verified, still return 200 — don't expose account state
    if (!user || user.email_verified) {
      return NextResponse.json({ ok: true })
    }

    const token = await createVerificationToken(user.id, 'email_verify')
    await sendVerificationEmail(email.toLowerCase().trim(), user.name, token).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // always 200
  }
}
