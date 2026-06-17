import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query } from '@/lib/db/aurora'
import { parseSearchQuery } from '@/lib/ai/v0'
import { getPresignedUrl } from '@/lib/s3/upload'

const PAGE_SIZE = 24

// Rule-based fallback parser — runs when AI is unavailable.
// Extracts industry, country, and meaningful keywords from plain-language queries.
const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  energy:        ['energy', 'solar', 'wind', 'renewable', 'power', 'electricity', 'photovoltaic', 'battery', 'hydrogen', 'oil', 'gas', 'petroleum', 'nuclear'],
  technology:    ['tech', 'technology', 'software', 'saas', 'it', 'digital', 'cloud', 'ai', 'data', 'cybersecurity', 'developer', 'startup', 'platform', 'app'],
  logistics:     ['logistics', 'freight', 'shipping', 'transport', 'supply chain', 'warehouse', 'distribution', 'cargo', 'courier', 'delivery'],
  manufacturing: ['manufacturing', 'factory', 'production', 'industrial', 'fabrication', 'assembly', 'machining', 'textile', 'packaging'],
  finance:       ['finance', 'financial', 'banking', 'investment', 'capital', 'fund', 'insurance', 'fintech', 'trading', 'asset'],
  healthcare:    ['health', 'healthcare', 'medical', 'pharma', 'biotech', 'hospital', 'clinical', 'diagnostic', 'drug', 'therapy', 'medicine'],
  retail:        ['retail', 'ecommerce', 'e-commerce', 'shop', 'store', 'consumer', 'fashion', 'lifestyle', 'brand', 'marketplace'],
  agriculture:   ['agriculture', 'agri', 'farming', 'food', 'crop', 'livestock', 'organic', 'beverage', 'grain'],
  legal:         ['legal', 'law', 'lawyer', 'attorney', 'compliance', 'regulatory', 'counsel'],
}

const COUNTRY_KEYWORDS: Record<string, string[]> = {
  SE: ['sweden', 'swedish', 'stockholm', 'gothenburg', 'malmö', 'malmo', 'scandinavia', 'nordic'],
  DE: ['germany', 'german', 'berlin', 'munich', 'hamburg', 'frankfurt', 'cologne', 'düsseldorf', 'deutschland'],
  FR: ['france', 'french', 'paris', 'lyon', 'marseille', 'bordeaux', 'toulouse'],
  GB: ['uk', 'united kingdom', 'britain', 'british', 'england', 'london', 'manchester', 'birmingham', 'edinburgh', 'glasgow'],
  NL: ['netherlands', 'dutch', 'holland', 'amsterdam', 'rotterdam', 'the hague', 'eindhoven'],
  AE: ['uae', 'dubai', 'abu dhabi', 'emirates', 'united arab emirates', 'mena', 'gulf'],
  CH: ['switzerland', 'swiss', 'zurich', 'geneva', 'basel', 'bern'],
  IL: ['israel', 'israeli', 'tel aviv', 'haifa', 'jerusalem'],
  KR: ['korea', 'korean', 'south korea', 'seoul', 'busan', 'incheon'],
  US: ['usa', 'united states', 'america', 'american', 'new york', 'san francisco', 'chicago', 'los angeles', 'austin', 'boston', 'miami', 'seattle'],
  NG: ['nigeria', 'nigerian', 'lagos', 'abuja', 'kano', 'ibadan'],
  BR: ['brazil', 'brazilian', 'são paulo', 'sao paulo', 'rio de janeiro', 'rio', 'brasilia'],
  JP: ['japan', 'japanese', 'tokyo', 'osaka', 'kyoto', 'yokohama', 'nagoya'],
  AU: ['australia', 'australian', 'sydney', 'melbourne', 'brisbane', 'perth', 'canberra'],
  CA: ['canada', 'canadian', 'toronto', 'vancouver', 'montreal', 'calgary', 'ottawa'],
  SG: ['singapore', 'singaporean', 'southeast asia', 'sea region'],
  ZA: ['south africa', 'south african', 'johannesburg', 'cape town', 'durban', 'pretoria'],
  IN: ['india', 'indian', 'mumbai', 'bangalore', 'bengaluru', 'delhi', 'hyderabad', 'pune', 'chennai'],
  CN: ['china', 'chinese', 'beijing', 'shanghai', 'shenzhen', 'guangzhou', 'hong kong'],
  MX: ['mexico', 'mexican', 'mexico city', 'guadalajara', 'monterrey'],
  EG: ['egypt', 'egyptian', 'cairo', 'alexandria'],
  SA: ['saudi arabia', 'saudi', 'riyadh', 'jeddah', 'dammam'],
  KE: ['kenya', 'kenyan', 'nairobi', 'mombasa'],
  IT: ['italy', 'italian', 'rome', 'milan', 'turin', 'florence', 'naples'],
  ES: ['spain', 'spanish', 'madrid', 'barcelona', 'valencia', 'seville'],
  PL: ['poland', 'polish', 'warsaw', 'krakow', 'wroclaw', 'gdansk'],
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'i', 'we', 'me', 'my', 'you', 'your',
  'company', 'companies', 'business', 'businesses', 'firm', 'firms',
  'that', 'which', 'who', 'whose', 'in', 'on', 'at', 'for',
  'with', 'by', 'from', 'to', 'of', 'about', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'do', 'does',
  'want', 'looking', 'find', 'need', 'search', 'seeking',
  'some', 'any', 'all', 'more', 'most', 'very', 'really',
  'can', 'could', 'would', 'should', 'will', 'may', 'might',
  'get', 'give', 'make', 'like', 'know', 'good', 'best',
  'also', 'just', 'only', 'even', 'both', 'each', 'other',
])

function parseQueryLocally(text: string): { industry: string | null; country: string | null; keywords: string } {
  const lower = text.toLowerCase()

  let industry: string | null = null
  for (const [ind, words] of Object.entries(INDUSTRY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) { industry = ind; break }
  }

  let country: string | null = null
  for (const [code, words] of Object.entries(COUNTRY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) { country = code; break }
  }

  // Keywords: remove stop words + industry/country words that are now handled as filters
  const industryWords = new Set(industry ? INDUSTRY_KEYWORDS[industry] ?? [] : [])
  const countryWords = new Set(country ? COUNTRY_KEYWORDS[country] ?? [] : [])

  const keywords = text
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !industryWords.has(w) && !countryWords.has(w))
    .join(' ')

  return { industry, country, keywords }
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

  // Run AI parse on natural language queries; fall back to local rule-based parser
  const geminiKey = req.headers.get('x-gemini-key') || undefined
  if (rawQ && rawQ.length > 2 && !countryParam && !industryParam) {
    try {
      const parsed = await parseSearchQuery(rawQ, geminiKey)
      if (parsed.country) parsedCountry = parsed.country
      if (parsed.industry) parsedIndustry = parsed.industry
      keywords = parsed.keywords?.trim() ?? ''
      aiParsed = true
    } catch {
      // AI unavailable — use rule-based parser
    }
  }

  if (!aiParsed && rawQ) {
    const local = parseQueryLocally(rawQ)
    parsedCountry = local.country
    parsedIndustry = local.industry
    keywords = local.keywords
    aiParsed = true
  }

  // ── Build WHERE ──────────────────────────────────────────────────────────────

  function buildConditions(withCountry: boolean, withIndustry: boolean, withKeywords: boolean) {
    const conds: string[] = [
      `b.verification_status = 'verified'`,
      `b.id != $1::uuid`,
    ]
    const prms: unknown[] = [session!.user.businessId]
    let idx = 2

    if (withCountry && parsedCountry) {
      conds.push(`b.country = $${idx++}`)
      prms.push(parsedCountry.toUpperCase())
    }
    if (withIndustry && parsedIndustry) {
      conds.push(`b.industry = $${idx++}`)
      prms.push(parsedIndustry)
    }
    if (withKeywords && keywords) {
      const ftsIdx = idx++
      prms.push(keywords)
      const words = keywords.split(/\s+/).filter((w) => w.length > 2)
      const wordClauses: string[] = []
      for (const word of words) {
        const wIdx = idx++
        prms.push(word)
        wordClauses.push(`b.name ILIKE '%' || $${wIdx} || '%'`)
        wordClauses.push(`b.description ILIKE '%' || $${wIdx} || '%'`)
      }
      const ilikeClause = wordClauses.length > 0 ? ` OR ${wordClauses.join(' OR ')}` : ''
      conds.push(`(b.search_vector @@ websearch_to_tsquery('english', $${ftsIdx})${ilikeClause})`)
    }
    return { where: `WHERE ${conds.join(' AND ')}`, params: prms, nextIdx: idx }
  }

  type BizRow = {
    id: string; name: string; slug: string; industry: string; country: string
    city: string | null; description: string | null; logo_s3_key: string | null
    verification_status: string; services: string[] | null; website: string | null
  }

  async function runQuery(where: string, prms: unknown[], nextIdx: number) {
    const p = [...prms, PAGE_SIZE, offset]
    return query<BizRow>(
      `SELECT b.id, b.name, b.slug, b.industry, b.country, b.city, b.description, b.logo_s3_key, b.verification_status, b.services, b.website
       FROM businesses b ${where}
       ORDER BY b.name ASC LIMIT $${nextIdx} OFFSET $${nextIdx + 1}`,
      p
    )
  }

  // First attempt: full filters (country + industry + keywords)
  let { where, params: qParams, nextIdx } = buildConditions(true, true, true)
  let businesses = await runQuery(where, qParams, nextIdx)

  let fallbackNote: string | null = null

  // If no results AND a specific country was requested, relax the country filter
  // but keep the industry — show same-sector companies from anywhere
  if (businesses.length === 0 && parsedCountry && parsedIndustry) {
    const { where: w2, params: p2, nextIdx: n2 } = buildConditions(false, true, false)
    businesses = await runQuery(w2, p2, n2)
    if (businesses.length > 0) {
      const countryName = Object.entries(COUNTRY_KEYWORDS)
        .find(([code]) => code === parsedCountry)?.[1]?.[0] ?? parsedCountry
      fallbackNote = `No ${parsedIndustry} companies found in ${countryName.charAt(0).toUpperCase() + countryName.slice(1)}. Showing verified partners from other regions:`
    }
  } else if (businesses.length === 0 && parsedCountry && !parsedIndustry) {
    // Country specified but no industry and no results — try keywords only
    const { where: w2, params: p2, nextIdx: n2 } = buildConditions(false, false, true)
    businesses = await runQuery(w2, p2, n2)
    if (businesses.length > 0) {
      const countryName = Object.entries(COUNTRY_KEYWORDS)
        .find(([code]) => code === parsedCountry)?.[1]?.[0] ?? parsedCountry
      fallbackNote = `No results found in ${countryName.charAt(0).toUpperCase() + countryName.slice(1)}. Showing similar verified partners:`
    }
  }

  const withUrls = await Promise.all(
    businesses.map(async (b) => ({
      ...b,
      logoUrl: b.logo_s3_key ? await getPresignedUrl(b.logo_s3_key) : null,
      services: b.services ?? [],
    }))
  )

  return NextResponse.json({ businesses: withUrls, page, pageSize: PAGE_SIZE, fallbackNote })
}
