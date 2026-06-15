import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, queryOne } from '@/lib/db/aurora'
import { validateToken, markTokenUsed } from '@/lib/auth/tokens'
import { createVerificationToken } from '@/lib/auth/tokens'
import { sendPasswordResetEmail } from '@/lib/email/ses'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Request password reset (send email)
    if (body.email) {
      const user = await queryOne<{ id: string; name: string; email: string }>(
        `SELECT id, name, email FROM users WHERE email = $1 AND is_active = true`,
        [body.email]
      )
      // Always return 200 to avoid email enumeration
      if (user) {
        const token = await createVerificationToken(user.id, 'password_reset', 1)
        await sendPasswordResetEmail(user.email, user.name, token)
      }
      return NextResponse.json({ success: true })
    }

    // Consume token + set new password
    if (body.token && body.password) {
      if (body.password.length < 12) {
        return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 })
      }

      const result = await validateToken(body.token, 'password_reset')
      if (!result) {
        return NextResponse.json({ error: 'Invalid or expired reset link' }, { status: 400 })
      }

      const hash = await bcrypt.hash(body.password, 12)
      await query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, result.userId])
      await markTokenUsed(result.tokenId)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err) {
    console.error('[reset-password]', err)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
