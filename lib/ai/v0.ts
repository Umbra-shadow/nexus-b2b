import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.V0_API_KEY!,
  baseURL: 'https://api.v0.dev/v1',
})

const MODEL = 'v0-1.5-md'

export interface SearchQueryParsed {
  industry: string | null
  country: string | null
  keywords: string
}

export async function parseSearchQuery(queryText: string): Promise<SearchQueryParsed> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: `Extract structured search parameters from this B2B business search query. Return ONLY a JSON object with fields: industry (one of: technology, finance, healthcare, manufacturing, logistics, retail, energy, agriculture, legal, other — or null if not specified), country (ISO 3166-1 alpha-2 code or null), keywords (cleaned search terms as a string).

Query: "${queryText}"

Return only valid JSON, nothing else.`,
      },
    ],
    temperature: 0,
  })

  try {
    const text = (completion.choices[0]?.message?.content ?? '').trim()
      .replace(/^```json\n?/, '')
      .replace(/\n?```$/, '')
    return JSON.parse(text) as SearchQueryParsed
  } catch {
    return { industry: null, country: null, keywords: queryText }
  }
}

export interface IntroductionParams {
  businessAName: string
  businessADescription: string
  agentAName: string
  businessBName: string
  businessBDescription: string
  agentBName: string
  searchContext?: string
}

export async function generateIntroduction(params: IntroductionParams): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are an AI business introduction specialist on NexusB2B, a verified B2B platform. Write only the introduction message — no meta-commentary, no preamble.',
      },
      {
        role: 'user',
        content: `Generate a warm, professional introduction message to open a deal session between two businesses. Be concise (3-4 sentences), formal, then announce you are stepping back and available on-demand.

Business A: ${params.businessAName} — ${params.businessADescription}
Agent A: ${params.agentAName}
Business B: ${params.businessBName} — ${params.businessBDescription}
Agent B: ${params.agentBName}
${params.searchContext ? `Context: ${params.agentAName}'s company is looking for: ${params.searchContext}` : ''}

End by telling both parties you are stepping back and they can call you anytime by typing /ai followed by their question.`,
      },
    ],
    temperature: 0.7,
  })

  return (
    completion.choices[0]?.message?.content ??
    "Welcome to NexusB2B! I'm connecting you both. I'll step back now — type /ai anytime to call me."
  )
}

export async function answerQuery(question: string): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content:
          'You are a professional B2B business assistant on NexusB2B. Answer questions concisely and helpfully in a professional tone. Answer only what is asked.',
      },
      {
        role: 'user',
        content: question,
      },
    ],
    temperature: 0.5,
  })

  return (
    completion.choices[0]?.message?.content ??
    'I was unable to process your question. Please try again.'
  )
}

export async function generateDemoReply(
  receiverBusinessName: string,
  receiverBusinessDescription: string,
  senderBusinessName: string,
  lastMessage: string
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are responding on behalf of ${receiverBusinessName} — ${receiverBusinessDescription}.
You are a professional business representative. Reply naturally and professionally to the other party's message in 2-4 sentences.
Stay in character as a representative of ${receiverBusinessName}. Do not break character or reveal you are an AI.`,
      },
      {
        role: 'user',
        content: `Message from ${senderBusinessName}: ${lastMessage}`,
      },
    ],
    temperature: 0.8,
  })

  return (
    completion.choices[0]?.message?.content ??
    `Thank you for reaching out. We are reviewing your message and will respond shortly.`
  )
}
