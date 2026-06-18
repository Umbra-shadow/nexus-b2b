import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne, transaction } from '@/lib/db/aurora'

interface Params { params: Promise<{ id: string }> }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL!

function isAdmin(session: { user: { email?: string | null; role?: string } }) {
  return session.user.email === process.env.PLATFORM_ADMIN_EMAIL || session.user.role === 'system_admin'
}

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!isAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const fd = await req.formData()
  const method = fd.get('_method') as string

  if (method === 'DELETE') {
    const biz = await queryOne<{ id: string }>(`SELECT id FROM businesses WHERE id = $1`, [id])
    if (!biz) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // All deletes in one transaction — either everything goes or nothing does.
    // Order: receipts → sessions → business (CASCADE handles users + verification_tokens)
    await transaction(async (client) => {
      await client.query(
        `DELETE FROM receipts WHERE session_id IN (
           SELECT id FROM sessions
           WHERE initiator_business_id = $1 OR receiver_business_id = $1
         )`,
        [id]
      )
      await client.query(
        `DELETE FROM sessions WHERE initiator_business_id = $1 OR receiver_business_id = $1`,
        [id]
      )
      // ON DELETE CASCADE on users.business_id removes users + verification_tokens automatically
      await client.query(`DELETE FROM businesses WHERE id = $1`, [id])
    })

    return NextResponse.redirect(new URL('/admin/businesses', APP_URL))
  }

  if (method === 'PATCH') {
    const name = (fd.get('name') as string)?.trim()
    const industry = fd.get('industry') as string
    const country = ((fd.get('country') as string) ?? '').trim().toUpperCase().slice(0, 2)
    const city = (fd.get('city') as string)?.trim() || null
    const website = (fd.get('website') as string)?.trim() || null
    const description = (fd.get('description') as string)?.trim() || null
    const contact_email = (fd.get('contact_email') as string)?.trim() || null
    const verification_status = fd.get('verification_status') as string

    if (!name || !industry || !country) {
      return NextResponse.json({ error: 'Name, industry and country are required' }, { status: 400 })
    }

    await query(
      `UPDATE businesses SET name=$1, industry=$2::industry_type, country=$3, city=$4, website=$5, description=$6, verification_status=$7::verification_status, contact_email=$8 WHERE id=$9`,
      [name, industry, country, city, website, description, verification_status, contact_email, id]
    )

    return NextResponse.redirect(new URL(`/admin/businesses/${id}`, APP_URL))
  }

  return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
}
