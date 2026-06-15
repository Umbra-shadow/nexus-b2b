import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { getPresignedUrl } from '@/lib/s3/upload'

interface Params { params: { id: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const row = await queryOne<Record<string, unknown>>(
    `SELECT
       s.*,
       ib.id as ib_id, ib.name as ib_name, ib.slug as ib_slug, ib.industry as ib_industry,
       ib.country as ib_country, ib.logo_s3_key as ib_logo,
       rb.id as rb_id, rb.name as rb_name, rb.slug as rb_slug, rb.industry as rb_industry,
       rb.country as rb_country, rb.logo_s3_key as rb_logo,
       ia.id as ia_id, ia.name as ia_name, ia.email as ia_email,
       ra.id as ra_id, ra.name as ra_name, ra.email as ra_email
     FROM sessions s
     JOIN businesses ib ON ib.id = s.initiator_business_id
     JOIN businesses rb ON rb.id = s.receiver_business_id
     JOIN users ia ON ia.id = s.initiator_agent_id
     LEFT JOIN users ra ON ra.id = s.receiver_agent_id
     WHERE s.id = $1`,
    [params.id]
  )

  if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const uid = session.user.businessId
  if (row.ib_id !== uid && row.rb_id !== uid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const [ibLogoUrl, rbLogoUrl] = await Promise.all([
    row.ib_logo ? getPresignedUrl(row.ib_logo as string) : null,
    row.rb_logo ? getPresignedUrl(row.rb_logo as string) : null,
  ])

  const shaped = {
    id: row.id,
    status: row.status,
    aiIntroduced: row.ai_introduced,
    searchContext: row.search_context,
    initiatorAgentId: row.initiator_agent_id,
    receiverAgentId: row.receiver_agent_id,
    createdAt: row.created_at,
    acceptedAt: row.accepted_at,
    closedAt: row.closed_at,
    initiatorBusiness: { id: row.ib_id, name: row.ib_name, slug: row.ib_slug, industry: row.ib_industry, country: row.ib_country, logoUrl: ibLogoUrl },
    receiverBusiness: { id: row.rb_id, name: row.rb_name, slug: row.rb_slug, industry: row.rb_industry, country: row.rb_country, logoUrl: rbLogoUrl },
    initiatorAgent: { id: row.ia_id, name: row.ia_name, email: row.ia_email },
    receiverAgent: row.ra_id ? { id: row.ra_id, name: row.ra_name, email: row.ra_email } : null,
  }

  return NextResponse.json({ session: shaped })
}
