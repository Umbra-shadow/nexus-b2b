import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { queryOne } from '@/lib/db/aurora'
import { getPresignedUrl } from '@/lib/s3/upload'

interface Params { params: { slug: string } }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const business = await queryOne<{
    id: string
    name: string
    slug: string
    industry: string
    country: string
    city: string | null
    description: string | null
    website: string | null
    logo_s3_key: string | null
    verification_status: string
  }>(
    `SELECT id, name, slug, industry, country, city, description, website, logo_s3_key, verification_status
     FROM businesses
     WHERE slug = $1 AND verification_status = 'verified'`,
    [params.slug]
  )

  if (!business) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const logoUrl = business.logo_s3_key ? await getPresignedUrl(business.logo_s3_key) : null

  // Check if the viewer already has an active session with this business
  const existingSession = await queryOne<{ id: string }>(
    `SELECT id FROM sessions
     WHERE (initiator_business_id = $1 AND receiver_business_id = $2)
        OR (initiator_business_id = $2 AND receiver_business_id = $1)
     AND status != 'closed'`,
    [session.user.businessId, business.id]
  )

  return NextResponse.json({
    business: { ...business, logoUrl },
    existingSessionId: existingSession?.id ?? null,
  })
}
