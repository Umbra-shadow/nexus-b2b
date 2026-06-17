import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { parseSearchQuery } from '@/lib/ai/v0'
import { getPresignedUrl } from '@/lib/s3/upload'

const PAGE_SIZE = 24

// Strip generic stop-words so the leftover keywords are meaningful for FTS
function stripStopWords(text: string): string {
  const STOPS = new Set([
    'a', 'an', 'the', 'i', 'we', 'me', 'my', 'you', 'your',
    'company', 'companies', 'business', 'businesses', 'firm', 'firms',
    'working', 'work', 'works', 'that', 'which', 'who', 'whose',
    'in', 'on', 'at', 'for', 'with', 'by', 'from', 'to', 'of', 'about',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'do', 'does',
    'want', 'looking', 'find', 'need', 'search', 'seeking', 'find',
    'some', 'any', 'all', 'more', 'most', 'very', 'really', 'quite',
    'can', 'could', 'would', 'should', 'will', 'shall', 'may', 'might',
    'get', 'give', 'make', 'like', 'know', 'think', 'good', 'best',
    'also', 'just', 'only', 'even', 'both', 'each', 'other', 'another',
  ])
  return text
    .split(/\s+/)
    .filter((w) => {
      const lower = w.toLowerCase().replace(/[^a-z]/g, '')
      return lower.length > 2 && !STOPS.has(lower)
    })
    .join(' ')
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const rawQ = searchParams.get('q') ?? ''
  const countryParam = searchParams.get('country')
  const industryParam = searchParams.get('industry')
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const offset = (page - 1) * PAGE_SIZE

  let parsedCountry = countryParam
  let parsedIndustry = industryParam
  let keywords = ''
  let aiParsed = false

  // Run AI parse on natural language queries
  if (rawQ && rawQ.length > 2 && !countryParam && !industryParam) {
    try {
      const parsed = await parseSearchQuery(rawQ)
      if (parsed.country) parsedCountry = parsed.country
      if (parsed.industry) parsedIndustry = parsed.industry
      // AI-extracted keywords are already clean (stop-words removed by the model)
      keywords = parsed.keywords?.trim() ?? ''
      aiParsed = true
    } catch {
      // Bedrock unavailable — strip stop-words ourselves
      keywords = stripStopWords(rawQ)
    }
  }

  if (!aiParsed && rawQ && !parsedIndustry && !parsedCountry) {
    keywords = stripStopWords(rawQ)
  }

  // ── Build WHERE ──────────────────────────────────────────────────────────────
  // Hard filters: verification, exclude self, country, industry (from chip OR AI)
  // Text filter: when keywords remain, use FTS with ILIKE fallback via OR so
  //   a hit on either passes — this prevents the AND gate from hiding results.
  // If industry/country was resolved by AI, we show ALL in that category even
  //   when no meaningful keywords remain.

  const conditions: string[] = [
    `b.verification_status = 'verified'`,
    `b.id != $1::uuid`,
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

  // Only add text search if keywords are meaningful AND industry/country alone
  // don't narrow things down enough (or weren't detected at all).
  if (keywords) {
    // FTS on the full keywords string
    const ftsIdx = pIdx++
    params.push(keywords)

    // Per-word ILIKE: split so "%solar energy%" (phrase) doesn't miss "Solara Energy"
    const words = keywords.split(/\s+/).filter((w) => w.length > 2)
    const wordClauses: string[] = []
    for (const word of words) {
      const wIdx = pIdx++
      params.push(word)
      wordClauses.push(`b.name ILIKE '%' || $${wIdx} || '%'`)
      wordClauses.push(`b.description ILIKE '%' || $${wIdx} || '%'`)
    }

    const ilikeClause = wordClauses.length > 0 ? ` OR ${wordClauses.join(' OR ')}` : ''
    conditions.push(`(
      b.search_vector @@ websearch_to_tsquery('english', $${ftsIdx})${ilikeClause}
    )`)
  }

  const where = `WHERE ${conditions.join(' AND ')}`
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
