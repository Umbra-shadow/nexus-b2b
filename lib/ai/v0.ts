import OpenAI from 'openai'

// Gemini via OpenAI-compatible endpoint.
// API key comes from the request (user-supplied in navbar) or falls back to env var.
function getClient(apiKey?: string) {
  return new OpenAI({
    apiKey: apiKey || process.env.GEMINI_API_KEY || '',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
  })
}

const MODEL = 'gemini-2.5-flash'

async function callV0(system: string, user: string, maxTokens = 512, apiKey?: string): Promise<string> {
  const res = await getClient(apiKey).chat.completions.create({
    model: MODEL,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  return res.choices[0]?.message?.content ?? ''
}

export interface SearchQueryParsed {
  industry: string | null
  country: string | null
  keywords: string
}

export async function parseSearchQuery(queryText: string, apiKey?: string): Promise<SearchQueryParsed> {
  // Let errors propagate — caller's catch block falls back to rule-based parser
  const text = await callV0(
    'You extract structured search parameters from B2B business search queries. Return ONLY valid JSON, nothing else.',
    `Extract search parameters. Return JSON with fields: industry (one of: technology, finance, healthcare, manufacturing, logistics, retail, energy, agriculture, legal, other — or null), country (ISO-2 or null), keywords (string of remaining search terms, NOT including industry/country words).
Query: "${queryText}"`,
    512,
    apiKey
  )
  const clean = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
  return JSON.parse(clean) as SearchQueryParsed
}

export interface IntroductionParams {
  businessAName: string
  businessADescription: string
  agentAName: string
  businessBName: string
  businessBDescription: string
  agentBName: string
  searchContext?: string
  selectedServices?: string[]
}

export async function generateIntroduction(params: IntroductionParams, apiKey?: string): Promise<string> {
  const servicesLine = params.selectedServices?.length
    ? `Services of interest: ${params.selectedServices.join(', ')}`
    : ''
  try {
    return await callV0(
      'You are Lummy, an AI business introduction specialist on NexusB2B — a verified B2B network. Write only the introduction message. No meta-commentary, no preamble, no markdown headers.',
      `Write a warm, professional opening message for a B2B deal session. Introduce both parties. Be concise (3–5 sentences). Close by telling them you step back and they can reach you via /ai.

Business A: ${params.businessAName} — ${params.businessADescription}
Agent A: ${params.agentAName}
Business B: ${params.businessBName} — ${params.businessBDescription}
Agent B: ${params.agentBName}
${params.searchContext ? `Context: ${params.searchContext}` : ''}
${servicesLine}`,
      512,
      apiKey
    )
  } catch {
    const note = params.selectedServices?.length
      ? ` Focus: ${params.selectedServices.join(', ')}.`
      : ''
    return `Welcome to NexusB2B. I'm Lummy — I've connected ${params.businessAName} and ${params.businessBName}. Both companies are verified on this network.${note} I'll step back now — type /ai followed by your question any time to reach me.`
  }
}

export async function answerQuery(question: string, apiKey?: string): Promise<string> {
  try {
    return await callV0(
      'You are Lummy, an AI assistant inside a B2B deal session on NexusB2B. You answer only business-relevant questions — market prices, industry benchmarks, trade regulations, logistics standards. Be concise and professional. If out of scope, politely decline.',
      question,
      512,
      apiKey
    )
  } catch {
    return lummyFallback(question)
  }
}

function lummyFallback(question: string): string {
  const q = question.toLowerCase()
  if (/price|cost|rate|tariff|how much/.test(q)) {
    return 'Pricing varies significantly by region and contract structure. As a reference point, spot market rates in Europe for standard freight are currently running 15–25% above 2024 averages due to Red Sea disruptions. I recommend benchmarking against FREIGHTOS or Xeneta for real-time data.'
  }
  if (/regulation|compliance|import|export|customs|tariff|duty/.test(q)) {
    return 'EU import regulations require HS code classification and a Certificate of Origin for most B2B goods. VAT treatment depends on the buyer\'s registration status. For non-EU suppliers, EORI registration is mandatory. Check the EU Trade Helpdesk for specifics on your product category.'
  }
  if (/logistics|shipping|freight|transport|delivery|route/.test(q)) {
    return 'For EU distribution, Rotterdam and Hamburg handle the bulk of container traffic. Rail connections into Central/Eastern Europe are increasingly cost-competitive with road. If you\'re looking at last-mile, DHL and DB Schenker have the strongest SME networks in the region.'
  }
  if (/contract|agreement|term|clause|SLA|NDA/.test(q)) {
    return 'Standard B2B supply contracts include Force Majeure, Liquidated Damages, and a dispute resolution clause. INCOTERMS 2020 (DAP or DDP) are the most common for European buyer-supplier arrangements. Consider a 3-month pilot clause before full commitment.'
  }
  if (/market|industry|sector|trend|growth|competitor/.test(q)) {
    return 'The sector is consolidating — larger players are acquiring regional operators. Margins are under pressure across the board, making operational efficiency the key differentiator. Cross-border B2B e-commerce in Europe grew 18% YoY in 2025, which is creating new demand patterns.'
  }
  if (/payment|invoice|credit|financing|escrow|factoring/.test(q)) {
    return 'Net-30/60 terms remain standard in European B2B. Invoice factoring rates are around 1.5–3% per 30 days with specialist providers. SEPA credit transfers have zero fees for EUR transactions within the Eurozone, making them preferable to wire transfers for recurring payments.'
  }
  return 'That\'s a nuanced question — the answer depends on your specific sector, jurisdiction, and deal structure. As a starting point, I\'d recommend reviewing the relevant EU Commission guidelines or reaching out to a specialist in that area. Would you like me to narrow down the scope?'
}

// ─── Smart contextual fallback ────────────────────────────────────────────────
// Used when Gemini is unavailable or no API key provided.

function pickFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function smartDemoFallback(
  receiverName: string,
  receiverDesc: string,
  senderName: string,
  lastMessage: string,
): string {
  const m = lastMessage.toLowerCase()

  if (/\b(price|pricing|cost|rate|quote|quotation|how much|fee|tariff|budget)\b/.test(m)) {
    return pickFrom([
      `Pricing depends on volume and contract length. For initial orders we typically work with a tiered model — can you give me a rough idea of the quantities you're thinking about? That'll let me put together something concrete.`,
      `Our rates vary by specification and order size. What's your target volume per shipment? Once I know that I can get you a firm quote within 48 hours.`,
      `We don't publish fixed prices — everything is negotiated based on volume, delivery schedule, and payment terms. What range are you working with on your end? Let's see if we're aligned.`,
    ])
  }
  if (/\b(volume|quantity|units|tons|metric|kg|pallet|container|bulk|MOQ|minimum order)\b/.test(m)) {
    return pickFrom([
      `Our minimum order is flexible depending on the product line. What's your projected monthly volume? We can structure the contract around that.`,
      `We handle everything from small pilot orders to full container loads. What are we talking — initial trial, or are you looking to set up a recurring supply arrangement?`,
      `Good question on volume. We've handled contracts from 500 units to 50,000 units monthly. What's your current consumption, and is this replacing an existing supplier?`,
    ])
  }
  if (/\b(timeline|delivery|lead time|when|deadline|schedule|urgent|ASAP|how long|ship|dispatch)\b/.test(m)) {
    return pickFrom([
      `Standard lead time from order confirmation is 3–4 weeks. If you have a hard deadline we can look at expedited production, though that typically carries a 12–15% premium. What's your target date?`,
      `We keep buffer stock for our main lines so quick-turnaround orders of up to 2,000 units are usually possible within 10 business days. Larger runs need 3–5 weeks. When do you need delivery?`,
      `Timeline depends on the specification. Custom orders need 4–6 weeks; off-the-shelf variants can ship in 5–7 business days. What are you working with?`,
    ])
  }
  if (/\b(certif|ISO|compliance|quality|audit|standard|regulation|approved|accredit)\b/.test(m)) {
    return pickFrom([
      `We're ISO 9001 certified and all products ship with full material test reports. We can also arrange independent third-party audits if your procurement process requires it. What certifications does your supply chain mandate?`,
      `Our facility was last audited in Q4 2025 and we hold CE, RoHS, and ISO 14001. We can share the full compliance pack — just let me know which standards you need to verify.`,
      `Compliance is non-negotiable for us. We maintain complete traceability from raw material to finished goods. What does your QA team typically request? We can prepare a supplier qualification dossier.`,
    ])
  }
  if (/\b(partner|partnership|long.term|exclusive|distributor|represent|agreement|contract|MOU|collaboration)\b/.test(m)) {
    return pickFrom([
      `A long-term partnership is exactly what we're interested in. We prefer working with a small number of reliable partners rather than running spot transactions. What does a typical supply agreement look like on your side?`,
      `We're open to exclusive distribution arrangements in markets where we don't have direct presence. Which region are you covering, and what's your current distribution reach?`,
      `A framework agreement makes sense if volumes are consistent. We've done this with partners in three other markets and it works well for both sides — fixed pricing, priority production slots. Want to sketch out the terms?`,
    ])
  }
  if (/\b(sample|trial|pilot|test|demo|prototype|proof of concept|small order)\b/.test(m)) {
    return pickFrom([
      `We do run sample programs — typically a nominal charge that's credited against your first full order. What specs should the samples match? I'll get that moving on our end.`,
      `A pilot batch is a smart way to start. We can do a small run at standard pricing so you can validate quality before committing to volume. How many units do you need for your trial?`,
      `Samples aren't a problem. We'd need your technical specifications and delivery address. Turnaround is usually 7–10 business days. Shall I put that in motion?`,
    ])
  }
  if (/\b(payment|terms|invoice|net 30|net 60|advance|deposit|LC|letter of credit|wire|transfer)\b/.test(m)) {
    return pickFrom([
      `Our standard terms are 30% deposit at order confirmation and 70% against bill of lading. For established partners we extend net-30 after the first two transactions. Is that workable for you?`,
      `We accept wire transfer and LC at sight. For new accounts we typically start with 50% advance — once there's a track record we can discuss extended terms. What does your finance team prefer?`,
      `Payment terms are negotiable depending on order value and relationship history. What's your standard preference? We can usually accommodate within reason.`,
    ])
  }
  if (/\b(service|services|what do you do|what you do|capabilities|offer|offering|speciali|product|solution|about you|about your|tell me)\b/.test(m)) {
    return pickFrom([
      `We ${receiverDesc.slice(0, 120).trimEnd()}. Our core focus is helping clients like ${senderName} scale efficiently — what specific part of that is most relevant to what you're working on?`,
      `${receiverName} ${receiverDesc.slice(0, 100).trimEnd()}. The clients who get the most value from us are typically looking for reliability and speed. Which of those matters more to you right now?`,
      `Good question. ${receiverDesc.slice(0, 110).trimEnd()}. We're selective about who we work with — what's the scale and urgency of what you're trying to solve?`,
    ])
  }
  if (/\b(hello|hi |hey |good morning|good afternoon|greetings|salut|bonjour|hola)\b/.test(m)) {
    return pickFrom([
      `Hello! Great to connect through NexusB2B. We've been looking to expand our partner network and ${senderName} looks like a strong fit. What brings you our way?`,
      `Hi there — pleased to meet you. I'm the partnerships lead here at ${receiverName}. I had a look at your profile before jumping in. What can we help you with?`,
      `Good to hear from you. ${receiverName} has been active on the platform for a while now and we always appreciate when verified companies reach out directly. What's on your agenda?`,
    ])
  }
  return pickFrom([
    `We specialise in exactly that kind of requirement. The variables that usually drive the deal are volume, lead time, and spec complexity — which of those is the tightest constraint for you?`,
    `That's squarely in our wheelhouse. We've worked with clients in your sector before and the key is understanding your timeline first. What's your target date for getting something in place?`,
    `Good question. We can go in a few directions depending on your priorities. What does success look like for you 6 months from now if this deal closes well?`,
    `That aligns well with what we do at ${receiverDesc.slice(0, 60).trimEnd()}. Walk me through your current situation — what's driving this conversation right now?`,
  ])
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateDemoReply(
  receiverBusinessName: string,
  receiverBusinessDescription: string,
  senderBusinessName: string,
  lastMessage: string,
  selectedServices?: string[],
  apiKey?: string,
): Promise<string> {
  const servicesList = selectedServices?.length
    ? `\nOur services include: ${selectedServices.join(', ')}.`
    : ''

  try {
    const reply = await callV0(
      `You are a senior business development representative at ${receiverBusinessName}.
About our company: ${receiverBusinessDescription}${servicesList}
You are in a live B2B deal room on NexusB2B, chatting with ${senderBusinessName}.

STRICT RULES — follow every one of these:
1. You are a real human professional. NEVER reveal or hint that you are an AI.
2. When asked about your services or what you do, describe your company's actual offerings in specific detail.
3. When asked about pricing, give realistic ranges or ask clarifying questions about volume/spec.
4. Keep every reply to 2–3 sentences maximum. No long paragraphs.
5. End EVERY reply with one focused, specific follow-up question.
6. NEVER use these phrases: "noted", "I'll get back to you", "let me check with my team",
   "let me take that back", "sounds interesting", "certainly", "absolutely", "of course",
   "I understand your concern", "great question"
7. Write naturally and directly — like a confident sales professional in a real conversation.`,
      `${senderBusinessName}: ${lastMessage}`,
      300,
      apiKey
    )
    if (reply && reply.trim().length > 15) return reply.trim()
    throw new Error('empty reply')
  } catch {
    return smartDemoFallback(receiverBusinessName, receiverBusinessDescription, senderBusinessName, lastMessage)
  }
}
