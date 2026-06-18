import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'
import { query, queryOne } from '@/lib/db/aurora'

const INDUSTRIES = ['technology', 'finance', 'healthcare', 'manufacturing', 'logistics', 'retail', 'energy', 'agriculture', 'legal', 'other']

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'list_businesses',
    description: 'List businesses on the platform, optionally filtered by verification status or searched by name.',
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['verified', 'pending', 'rejected'], description: 'Filter by verification status' },
        search: { type: 'string', description: 'Search by business name (partial match)' },
        limit: { type: 'number', description: 'Max results to return (default 20)' },
      },
    },
  },
  {
    name: 'get_business',
    description: 'Get full details of a specific business by name or UUID.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Business name (partial match) or UUID' },
      },
      required: ['query'],
    },
  },
  {
    name: 'update_business_status',
    description: 'Approve, reject, or reset the verification status of a business.',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string', description: 'UUID of the business' },
        status: { type: 'string', enum: ['verified', 'rejected', 'pending'], description: 'New verification status' },
      },
      required: ['business_id', 'status'],
    },
  },
  {
    name: 'update_business_details',
    description: 'Update editable fields of a business: name, industry, country (2-letter ISO), city, website, or description.',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string', description: 'UUID of the business' },
        name: { type: 'string' },
        industry: { type: 'string', enum: INDUSTRIES },
        country: { type: 'string', description: '2-letter ISO country code, e.g. US, NG, GB' },
        city: { type: 'string' },
        website: { type: 'string' },
        description: { type: 'string', description: 'Max 500 characters' },
      },
      required: ['business_id'],
    },
  },
  {
    name: 'create_business',
    description: 'Create a new business on the platform. Industry must be one of the allowed enum values. Country must be a 2-letter ISO code.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Business name' },
        industry: { type: 'string', enum: INDUSTRIES },
        country: { type: 'string', description: '2-letter ISO country code' },
        city: { type: 'string' },
        website: { type: 'string' },
        description: { type: 'string', description: 'Short description, max 500 chars' },
        verification_status: { type: 'string', enum: ['pending', 'verified'], description: 'Initial status (default: pending)' },
      },
      required: ['name', 'industry', 'country'],
    },
  },
  {
    name: 'delete_business',
    description: 'Permanently delete a business and all its users. This cannot be undone. Always confirm with the user before calling this.',
    parameters: {
      type: 'object',
      properties: {
        business_id: { type: 'string', description: 'UUID of the business to delete' },
      },
      required: ['business_id'],
    },
  },
]

// ── Tool execution ────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'list_businesses': {
      const { status, search, limit = 20 } = args as { status?: string; search?: string; limit?: number }
      const rows = await query(`
        SELECT b.id, b.name, b.industry, b.country, b.city, b.verification_status, b.created_at,
               COUNT(u.id)::text AS user_count,
               MAX(CASE WHEN u.role = 'business_admin' THEN u.email END) AS admin_email
        FROM businesses b LEFT JOIN users u ON u.business_id = b.id
        WHERE ($1::text IS NULL OR b.verification_status::text = $1::text)
          AND ($2::text IS NULL OR b.name ILIKE '%' || $2 || '%')
        GROUP BY b.id ORDER BY b.created_at DESC LIMIT $3
      `, [status ?? null, search ?? null, limit])
      return { count: rows.length, businesses: rows }
    }

    case 'get_business': {
      const { query: q } = args as { query: string }
      const isUUID = /^[0-9a-f-]{36}$/i.test(q)
      const row = await queryOne(`
        SELECT b.*, COUNT(u.id)::text AS user_count,
               MAX(CASE WHEN u.role = 'business_admin' THEN u.email END) AS admin_email
        FROM businesses b LEFT JOIN users u ON u.business_id = b.id
        WHERE ${isUUID ? 'b.id = $1' : 'b.name ILIKE $1'}
        GROUP BY b.id LIMIT 1
      `, [isUUID ? q : `%${q}%`])
      if (!row) return { error: `No business found matching "${q}"` }
      return row
    }

    case 'update_business_status': {
      const { business_id, status } = args as { business_id: string; status: string }
      const updated = await queryOne(
        `UPDATE businesses SET verification_status = $1::verification_status WHERE id = $2 RETURNING id, name, verification_status`,
        [status, business_id]
      )
      if (!updated) return { error: `Business ${business_id} not found` }
      return { success: true, business: updated }
    }

    case 'update_business_details': {
      const { business_id, ...fields } = args as Record<string, string>
      const allowed = ['name', 'industry', 'country', 'city', 'website', 'description']
      const updates = Object.entries(fields).filter(([k]) => allowed.includes(k))
      if (updates.length === 0) return { error: 'No valid fields provided to update' }

      const setClauses = updates.map(([k], i) => `${k} = $${i + 2}${k === 'industry' ? '::industry_type' : ''}`).join(', ')
      const values = [business_id, ...updates.map(([, v]) => v)]

      const updated = await queryOne(
        `UPDATE businesses SET ${setClauses} WHERE id = $1 RETURNING id, name, industry, country, city, website, verification_status`,
        values
      )
      if (!updated) return { error: `Business ${business_id} not found` }
      return { success: true, business: updated }
    }

    case 'create_business': {
      const { name, industry, country, city, website, description, verification_status = 'pending' } = args as Record<string, string>
      const base = (name as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      const slug = `${base}-${Date.now().toString(36)}`
      const row = await queryOne(
        `INSERT INTO businesses (name, slug, industry, country, city, website, description, verification_status)
         VALUES ($1, $2, $3::industry_type, $4, $5, $6, $7, $8::verification_status)
         RETURNING id, name, slug, industry, country, verification_status`,
        [name, slug, industry, country, city ?? null, website ?? null, description ?? null, verification_status]
      )
      return { success: true, business: row }
    }

    case 'delete_business': {
      const { business_id } = args as { business_id: string }
      const biz = await queryOne(`SELECT name FROM businesses WHERE id = $1`, [business_id])
      if (!biz) return { error: `Business ${business_id} not found` }
      try {
        await query(`DELETE FROM users WHERE business_id = $1`, [business_id])
        await query(`DELETE FROM businesses WHERE id = $1`, [business_id])
        return { success: true, deleted: (biz as { name: string }).name }
      } catch (err: unknown) {
        return { error: `Delete failed — business may have active sessions or receipts. Error: ${err instanceof Error ? err.message : String(err)}` }
      }
    }

    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ── Context snapshot ──────────────────────────────────────────────────────────

async function getSystemContext(): Promise<string> {
  const [statsRows, pendingRows] = await Promise.all([
    query<Record<string, string>>(`
      SELECT
        (SELECT COUNT(*) FROM businesses)::text                                        AS total_businesses,
        (SELECT COUNT(*) FROM businesses WHERE verification_status='verified')::text   AS verified,
        (SELECT COUNT(*) FROM businesses WHERE verification_status='pending')::text    AS pending,
        (SELECT COUNT(*) FROM businesses WHERE verification_status='rejected')::text   AS rejected,
        (SELECT COUNT(*) FROM users)::text                                             AS total_users,
        (SELECT COUNT(*) FROM users WHERE email_verified=false)::text                 AS unverified_users,
        (SELECT COUNT(*) FROM sessions WHERE status='active')::text                   AS active_sessions,
        (SELECT COUNT(*) FROM receipts)::text                                          AS total_receipts,
        (SELECT COALESCE(SUM(total),0) FROM receipts)::text                           AS total_volume
    `),
    query<{ name: string; country: string; industry: string; created_at: string }>(
      `SELECT name, country, industry, created_at FROM businesses WHERE verification_status='pending' ORDER BY created_at DESC LIMIT 5`
    ),
  ])

  const s = statsRows[0] ?? {}
  const pendingList = pendingRows.length === 0
    ? 'None.'
    : pendingRows.map(b => `  - ${b.name} (${b.industry}, ${b.country})`).join('\n')

  return `## Live Platform Stats
- Businesses: ${s.total_businesses} total (${s.verified} verified, ${s.pending} pending, ${s.rejected} rejected)
- Users: ${s.total_users} total, ${s.unverified_users} unverified
- Active sessions: ${s.active_sessions}
- Receipts: ${s.total_receipts}, $${parseFloat(s.total_volume ?? '0').toLocaleString()} volume

## Businesses Pending Review
${pendingList}

## Allowed industry values
${INDUSTRIES.join(', ')}

## Country format
Always use 2-letter ISO codes (e.g. US, NG, GB, DE, AE).`
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth()
  if (
    !session?.user ||
    (session.user.email !== process.env.PLATFORM_ADMIN_EMAIL && session.user.role !== 'system_admin')
  ) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages, key } = await req.json() as { messages: { role: string; content: string }[]; key: string }
  if (!messages?.length) return NextResponse.json({ error: 'No messages.' }, { status: 400 })
  if (!key) return NextResponse.json({ error: 'No Gemini API key set. Add your key in the top bar.' })

  const context = await getSystemContext()

  const systemPrompt = `You are the AI assistant for NexusB2B system administrators. You can answer questions AND perform CRUD operations on businesses using the tools provided.

Today: ${new Date().toISOString().slice(0, 10)}

${context}

## Guidelines
- When asked to approve/reject/delete a business, first use get_business to find its ID if you only have a name.
- Always confirm before deleting — ask the user "Are you sure you want to permanently delete [name]?" and wait for confirmation.
- After every write operation, describe what changed in plain language.
- Use plain text only — no markdown headers or bullet formatting in your responses.
- For fields you can't find in context, use the list_businesses or get_business tools to look them up.`

  // Build Gemini content array from message history
  let contents = messages.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.content }],
  }))

  const geminiTools = [{ function_declarations: TOOLS }]

  // Tool-calling loop (max 5 rounds)
  for (let round = 0; round < 5; round++) {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          tools: geminiTools,
          tool_config: { function_calling_config: { mode: 'AUTO' } },
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!geminiRes.ok) {
      const err = await geminiRes.json()
      return NextResponse.json({ error: `Gemini: ${err.error?.message ?? geminiRes.statusText}` })
    }

    const data = await geminiRes.json()
    const candidate = data.candidates?.[0]
    const parts: unknown[] = candidate?.content?.parts ?? []

    // Check if any part is a function call
    const fnCalls = (parts as Array<{ functionCall?: { name: string; args: Record<string, unknown> } }>)
      .filter(p => p.functionCall)
      .map(p => p.functionCall!)

    if (fnCalls.length === 0) {
      // Text response — we're done
      const answer = (parts as Array<{ text?: string }>).map(p => p.text ?? '').join('').trim()
      return NextResponse.json({ answer: answer || 'No response from AI.' })
    }

    // Execute all function calls and collect responses
    contents = [...contents, { role: 'model', parts: parts as { text: string }[] }]

    const responseParts = await Promise.all(
      fnCalls.map(async fn => {
        const result = await executeTool(fn.name, fn.args)
        return {
          functionResponse: {
            name: fn.name,
            response: { result },
          },
        }
      })
    )

    contents = [...contents, { role: 'user', parts: responseParts as unknown as { text: string }[] }]
  }

  return NextResponse.json({ answer: 'The AI took too many steps. Please try a more specific request.' })
}
