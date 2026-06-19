import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { encrypt } from '@/lib/crypto/encrypt'
import { sendVerificationResult } from '@/lib/email/ses'

interface Params { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const { action, note } = body as { action: 'approve' | 'reject'; note?: string }

  if (!['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const cr = await queryOne<{
    id: string
    business_id: string
    type: string
    status: string
    payload: Record<string, unknown>
    admin_email: string
    business_name: string
    admin_name: string
  }>(
    `SELECT r.id, r.business_id, r.type, r.status, r.payload,
            b.name as business_name,
            u.email as admin_email, u.name as admin_name
     FROM business_change_requests r
     JOIN businesses b ON b.id = r.business_id
     JOIN users u ON u.id = r.requested_by
     WHERE r.id = $1`,
    [id]
  )

  if (!cr) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  if (cr.status !== 'pending') return NextResponse.json({ error: 'Request already reviewed' }, { status: 409 })

  const newStatus = action === 'approve' ? 'approved' : 'rejected'

  // If approving an update_info request, apply the changes to the business
  if (action === 'approve' && cr.type === 'update_info') {
    const p = cr.payload
    const sets: string[] = []
    const vals: unknown[] = []
    let idx = 1

    if (p.name)        { sets.push(`name = $${idx++}`);        vals.push(p.name) }
    if (p.city)        { sets.push(`city = $${idx++}`);        vals.push(p.city) }
    if (p.website !== undefined) { sets.push(`website = $${idx++}`); vals.push(p.website || null) }
    if (p.description) { sets.push(`description = $${idx++}`); vals.push(p.description) }
    if (p.bankAccountName)   { sets.push(`bank_account_name = $${idx++}`);   vals.push(encrypt(String(p.bankAccountName))) }
    if (p.bankName)          { sets.push(`bank_name = $${idx++}`);           vals.push(encrypt(String(p.bankName))) }
    if (p.bankAccountNumber) { sets.push(`bank_account_number = $${idx++}`); vals.push(encrypt(String(p.bankAccountNumber))) }
    if (p.bankSwift)         { sets.push(`bank_swift = $${idx++}`);          vals.push(encrypt(String(p.bankSwift))) }

    if (sets.length > 0) {
      vals.push(cr.business_id)
      await query(`UPDATE businesses SET ${sets.join(', ')} WHERE id = $${idx}`, vals)
    }
  }

  // If approving a delete_business request, mark business as deleted
  if (action === 'approve' && cr.type === 'delete_business') {
    // Soft-delete: deactivate all users + mark business as deleted
    // We keep all data (messages, sessions, receipts) intact for audit trail
    await query(`UPDATE users SET is_active = false WHERE business_id = $1`, [cr.business_id])
    await query(`UPDATE businesses SET verification_status = 'deleted' WHERE id = $1`, [cr.business_id])
  }

  // Mark request reviewed
  await query(
    `UPDATE business_change_requests
     SET status = $1, reviewed_by = $2, reviewed_at = NOW(), admin_note = $3
     WHERE id = $4`,
    [newStatus, session.user.id, note ?? null, id]
  )

  // Notify the business admin by email (non-fatal)
  try {
    if (cr.type === 'update_info') {
      await sendVerificationResult(
        cr.admin_email,
        cr.business_name,
        action === 'approve',
        action === 'reject' ? (note ?? 'Your update request was not approved.') : undefined
      )
    }
    // For delete_business, send a custom note if needed — omitted for brevity
  } catch {
    // non-fatal
  }

  return NextResponse.json({ success: true })
}
