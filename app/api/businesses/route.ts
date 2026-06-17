import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { parseSearchQuery } from '@/lib/ai/v0'
import { getPresignedUrl } from '@/lib/s3/upload'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const rawQ = searchParams.get('q') ?? ''
  const country = searchParams.get('country')
  const industry = searchParams.get('industry')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  // AI-assisted query parsing for natural language
  let keywords = rawQ
  let parsedCountry = country
  let parsedIndustry = industry

  if (rawQ && rawQ.length > 3 && !country && !industry) {
    try {
      const parsed = await parseSearchQuery(rawQ)
      if (parsed.country && !country) parsedCountry = parsed.country
      if (parsed.industry && !industry) parsedIndustry = parsed.industry
      keywords = parsed.keywords || rawQ
    } catch {
      // AI unavailable — fall back to plain keyword search
    }
  }

  const conditions: string[] = [
    `b.verification_status = 'verified'`,
    `b.id != (SELECT id FROM businesses WHERE id = $1)`,
  ]
  const params: unknown[] = [session.user.businessId]
  let pIdx = 2

  if (parsedCountry) {
    conditions.push(`b.country = $${pIdx++}`)
    params.push(parsedCountry.toUpperCase())
  }
  if (parsedIndustry) {
    conditions.push(`b.industry = $${pIdx++}`)
    params.push(parsedIndustry)
  }
  if (keywords.trim()) {
    conditions.push(`b.search_vector @@ plainto_tsquery('english', $${pIdx++})`)
    params.push(keywords.trim())
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  params.push(PAGE_SIZE, offset)

  const businesses = await query<{
    id: string
    name: string
    slug: string
    industry: string
    country: string
    city: string | null
    description: string | null
    logo_s3_key: string | null
    verification_status: string
    services: string[] | null
  }>(
    `SELECT b.id, b.name, b.slug, b.industry, b.country, b.city, b.description, b.logo_s3_key, b.verification_status, b.services
     FROM businesses b
     ${where}
     ORDER BY b.name ASC
     LIMIT $${pIdx} OFFSET $${pIdx + 1}`,
    params
  )

  const withUrls = await Promise.all(
    businesses.map(async (b) => ({
      ...b,
      logoUrl: b.logo_s3_key ? await getPresignedUrl(b.logo_s3_key) : null,
      services: b.services ?? [],
    }))
  )

  return NextResponse.json({ businesses: withUrls, page, pageSize: PAGE_SIZE })
}
