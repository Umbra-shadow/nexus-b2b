import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'
import { encrypt, decrypt } from '@/lib/crypto/encrypt'
import { UpdateBusinessSchema } from '@/lib/validators'

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await queryOne<Record<string, string | null>>(
    `SELECT name, description, city, website, industry,
            bank_account_name, bank_account_number, bank_name, bank_swift,
            verification_status
     FROM businesses WHERE id = $1`,
    [session.user.businessId]
  )

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (session.user.role === 'business_admin') {
    business.bank_account_name = business.bank_account_name ? decrypt(business.bank_account_name) : null
    business.bank_account_number = business.bank_account_number ? decrypt(business.bank_account_number) : null
    business.bank_name = business.bank_name ? decrypt(business.bank_name) : null
    business.bank_swift = business.bank_swift ? decrypt(business.bank_swift) : null
  } else {
    delete business.bank_account_name
    delete business.bank_account_number
    delete business.bank_name
    delete business.bank_swift
  }

  return NextResponse.json({ business })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdateBusinessSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 422 })
  }

  const d = parsed.data
  const sets: string[] = []
  const params: unknown[] = []
  let idx = 1

  if (d.name !== undefined) { sets.push(`name = $${idx++}`); params.push(d.name) }
  if (d.description !== undefined) { sets.push(`description = $${idx++}`); params.push(d.description) }
  if (d.city !== undefined) { sets.push(`city = $${idx++}`); params.push(d.city) }
  if (d.website !== undefined) { sets.push(`website = $${idx++}`); params.push(d.website || null) }
  if (d.industry !== undefined) { sets.push(`industry = $${idx++}`); params.push(d.industry) }

  if (session.user.role === 'business_admin') {
    if (d.bankAccountName !== undefined) { sets.push(`bank_account_name = $${idx++}`); params.push(d.bankAccountName ? encrypt(d.bankAccountName) : null) }
    if (d.bankAccountNumber !== undefined) { sets.push(`bank_account_number = $${idx++}`); params.push(d.bankAccountNumber ? encrypt(d.bankAccountNumber) : null) }
    if (d.bankName !== undefined) { sets.push(`bank_name = $${idx++}`); params.push(d.bankName ? encrypt(d.bankName) : null) }
    if (d.bankSwift !== undefined) { sets.push(`bank_swift = $${idx++}`); params.push(d.bankSwift ? encrypt(d.bankSwift) : null) }
  }

  if (sets.length === 0) return NextResponse.json({ success: true })

  params.push(session.user.businessId)
  await query(`UPDATE businesses SET ${sets.join(', ')} WHERE id = $${idx}`, params)

  return NextResponse.json({ success: true })
}
