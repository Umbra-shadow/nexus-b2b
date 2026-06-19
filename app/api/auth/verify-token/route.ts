import { NextRequest, NextResponse } from 'next/server'
import { validateToken, markTokenUsed } from '@/lib/auth/tokens'
import { query } from '@/lib/db/aurora'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) return NextResponse.json({ ok: false })

    const result = await validateToken(token, 'email_verify')
    if (!result) return NextResponse.json({ ok: false })

    await query(`UPDATE users SET email_verified = true WHERE id = $1`, [result.userId])
    await markTokenUsed(result.tokenId)

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
