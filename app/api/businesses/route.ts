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

// Words that explicitly name an industry as the subject of the search (not just capabilities).
// "I want logistics companies" → industry filter. "AI logistics startup" → keyword only.
const EXPLICIT_INDUSTRY_PHRASES = new Set([
  'logistics company', 'logistics companies', 'logistics firm', 'logistics firms',
  'manufacturing company', 'manufacturing companies', 'manufacturer', 'manufacturers',
  'finance company', 'finance firms', 'financial company', 'financial companies',
  'healthcare company', 'healthcare companies', 'health company',
  'technology company', 'technology companies', 'tech company', 'tech companies',
  'retail company', 'retail companies', 'retailer', 'retailers',
  'energy company', 'energy companies',
  'agriculture company', 'agriculture companies', 'agri company', 'farming company',
  'legal firm', 'law firm', 'law firms', 'legal company',
])

function parseQueryLocally(text: string): { industry: string | null; country: string | null; keywords: string } {
  const lower = text.toLowerCase()

  // Only set an industry filter when the query explicitly names a sector as the target,
  // not when sector-adjacent capability words appear (e.g. "ai", "solar", "blockchain").
  let industry: string | null = null
  const hasExplicitIndustry = [...EXPLICIT_INDUSTRY_PHRASES].some((p) => lower.includes(p))
  if (hasExplicitIndustry) {
    for (const [ind, words] of Object.entries(INDUSTRY_KEYWORDS)) {
      if (words.some((w) => lower.includes(w))) { industry = ind; break }
    }
  }

  let country: string | null = null
  for (const [code, words] of Object.entries(COUNTRY_KEYWORDS)) {
    if (words.some((w) => lower.includes(w))) { country = code; break }
  }

  // All meaningful words become keywords so they match names/descriptions across all industries.
  const countryWords = new Set(country ? COUNTRY_KEYWORDS[country] ?? [] : [])

  const keywords = text
    .split(/\s+/)
    .map((w) => w.toLowerCase().replace(/[^a-z]/g, ''))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w) && !countryWords.has(w))
    .join(' ')

  return { industry, country, keywords }
}

export async function GET(req: NextRequest) {
  try {
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

  // Run AI parse on natural language queries; fall back to local rule-based parser.
  // Industry filter is only applied when the query explicitly names a sector (e.g. "logistics companies").
  // Capability terms like "ai", "solar", "blockchain" go into keywords so they match across industries.
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
    // Only apply industry filter if the user explicitly named the sector.
    // Capability words ("ai", "solar") should remain as keywords to match across all industries.
    parsedIndustry = local.industry
    keywords = local.keywords
    aiParsed = true
  }

  // ── Build WHERE ──────────────────────────────────────────────────────────────

  // Exclude own business; use a sentinel UUID if businessId is missing so the cast never throws.
  const ownBusinessId = (session!.user as { businessId?: string }).businessId || '00000000-0000-0000-0000-000000000000'

  function buildConditions(withCountry: boolean, withIndustry: boolean, withKeywords: boolean) {
    const conds: string[] = [
      `b.verification_status = 'verified'`,
      `b.id != $1::uuid`,
    ]
    const prms: unknown[] = [ownBusinessId]
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
      const words = keywords.split(/\s+/).filter((w) => w.length > 1)
      const wordClauses: string[] = []
      for (const word of words) {
        const wIdx = idx++
        prms.push(word)
        // \y is PostgreSQL word-boundary in ARE regex — prevents "ai" matching "retail", "email", etc.
        wordClauses.push(`b.name ~* ('\\y' || $${wIdx} || '\\y')`)
        wordClauses.push(`b.description ~* ('\\y' || $${wIdx} || '\\y')`)
        wordClauses.push(`b.industry::text ~* ('\\y' || $${wIdx} || '\\y')`)
      }
      if (wordClauses.length > 0) {
        conds.push(`(${wordClauses.join(' OR ')})`)
      }
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

  // If no results, relax keyword filter but keep industry (so "ai related business" stays in technology).
  // Only fall back to show-all if no industry was detected or industry-only also returns nothing.
  if (businesses.length === 0 && rawQ) {
    if (parsedIndustry) {
      const { where: w2, params: p2, nextIdx: n2 } = buildConditions(false, true, false)
      businesses = await runQuery(w2, p2, n2)
      if (businesses.length > 0) {
        fallbackNote = `Showing verified ${parsedIndustry} partners:`
      }
    }
    if (businesses.length === 0) {
      const { where: w2, params: p2, nextIdx: n2 } = buildConditions(false, false, false)
      businesses = await runQuery(w2, p2, n2)
      if (businesses.length > 0) {
        fallbackNote = `No exact matches found. Showing all verified partners:`
      }
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
  } catch (err) {
    console.error('[api/businesses] error:', err)
    return NextResponse.json({ businesses: [], page: 1, pageSize: PAGE_SIZE, fallbackNote: null }, { status: 200 })
  }
}
