import { randomBytes } from 'crypto'
import { query, queryOne } from '@/lib/db/aurora'

export function generateToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createVerificationToken(
  userId: string,
  type: 'email_verify' | 'password_reset' | 'invite',
  expiresInHours = 48
): Promise<string> {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

  await query(
    `INSERT INTO verification_tokens (user_id, token, type, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, token, type, expiresAt]
  )

  return token
}

export async function validateToken(
  token: string,
  type: 'email_verify' | 'password_reset' | 'invite'
): Promise<{ userId: string; tokenId: string } | null> {
  const row = await queryOne<{ id: string; user_id: string; expires_at: Date; used_at: Date | null }>(
    `SELECT id, user_id, expires_at, used_at
     FROM verification_tokens
     WHERE token = $1 AND type = $2`,
    [token, type]
  )

  if (!row) return null
  if (row.used_at) return null
  if (new Date(row.expires_at) < new Date()) return null

  return { userId: row.user_id, tokenId: row.id }
}

export async function markTokenUsed(tokenId: string): Promise<void> {
  await query(
    `UPDATE verification_tokens SET used_at = NOW() WHERE id = $1`,
    [tokenId]
  )
}
