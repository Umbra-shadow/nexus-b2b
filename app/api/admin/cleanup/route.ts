import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne, transaction } from '@/lib/db/aurora'

function isAdmin(s: { user: { email?: string | null; role?: string } }) {
  return s.user.email === process.env.PLATFORM_ADMIN_EMAIL || s.user.role === 'system_admin'
}

// POST /api/admin/cleanup  { email: "user@example.com" }
// Deletes the user AND their entire business (all sessions, receipts, team members).
// Safe-guards: cannot delete the platform admin email.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { email } = await req.json() as { email?: string }
  if (!email?.trim()) return NextResponse.json({ error: 'email is required' }, { status: 400 })

  const target = email.trim().toLowerCase()

  if (target === process.env.PLATFORM_ADMIN_EMAIL?.toLowerCase()) {
    return NextResponse.json({ error: 'Cannot delete the platform admin account' }, { status: 400 })
  }

  const user = await queryOne<{ id: string; business_id: string | null; role: string }>(
    `SELECT id, business_id, role FROM users WHERE LOWER(email) = $1`,
    [target]
  )

  if (!user) return NextResponse.json({ error: `No account found for ${email}` }, { status: 404 })

  const businessId = user.business_id

  await transaction(async (client) => {
    if (businessId) {
      // Wipe everything attached to this business
      await client.query(
        `DELETE FROM receipts WHERE session_id IN (
           SELECT id FROM sessions
           WHERE initiator_business_id = $1 OR receiver_business_id = $1
         )`,
        [businessId]
      )
      await client.query(
        `DELETE FROM sessions WHERE initiator_business_id = $1 OR receiver_business_id = $1`,
        [businessId]
      )
      // CASCADE removes all users in this business + their verification_tokens
      await client.query(`DELETE FROM businesses WHERE id = $1`, [businessId])
    } else {
      // No business (e.g. orphaned user row) — delete just the user
      await client.query(`DELETE FROM verification_tokens WHERE user_id = $1`, [user.id])
      await client.query(`DELETE FROM users WHERE id = $1`, [user.id])
    }
  })

  return NextResponse.json({
    success: true,
    message: businessId
      ? `Deleted account for ${email} and their entire business + all related data.`
      : `Deleted orphaned user account for ${email}.`,
  })
}
