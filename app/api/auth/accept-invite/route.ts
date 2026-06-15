import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query } from '@/lib/db/aurora'
import { validateToken, markTokenUsed } from '@/lib/auth/tokens'

export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json()

    if (!token || !name || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 })
    }

    const result = await validateToken(token, 'invite')
    if (!result) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 })
    }

    const hash = await bcrypt.hash(password, 12)
    await query(
      `UPDATE users SET name = $1, password_hash = $2, email_verified = true WHERE id = $3`,
      [name, hash, result.userId]
    )
    await markTokenUsed(result.tokenId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[accept-invite]', err)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
