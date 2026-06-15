import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const MODEL = 'gemini-2.0-flash'

export interface SearchQueryParsed {
  industry: string | null
  country: string | null
  keywords: string
}

export async function parseSearchQuery(query: string): Promise<SearchQueryParsed> {
  const model = genAI.getGenerativeModel({ model: MODEL })

  const result = await model.generateContent(
    `Extract structured search parameters from this B2B business search query. Return ONLY a JSON object with fields: industry (one of: technology, finance, healthcare, manufacturing, logistics, retail, energy, agriculture, legal, other — or null if not specified), country (ISO 3166-1 alpha-2 code or null), keywords (cleaned search terms as a string).

Query: "${query}"

Return only valid JSON, nothing else.`
  )

  try {
    const text = result.response.text().trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(text) as SearchQueryParsed
  } catch {
    return { industry: null, country: null, keywords: query }
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
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction:
      'You are an AI business introduction specialist on NexusB2B, a verified B2B platform. Write only the introduction message — no meta-commentary, no preamble.',
  })

  const prompt = `Generate a warm, professional introduction message to open a deal session between two businesses. Be concise (3-4 sentences), formal, and then announce you are stepping back and available on-demand.

Business A: ${params.businessAName} — ${params.businessADescription}
Agent A: ${params.agentAName}
Business B: ${params.businessBName} — ${params.businessBDescription}
Agent B: ${params.agentBName}
${params.searchContext ? `Context: ${params.agentAName}'s company is looking for: ${params.searchContext}` : ''}

End by telling both parties you are stepping back and they can call you anytime by typing /ai followed by their question.`

  const result = await model.generateContent(prompt)
  return result.response.text() || "Hello! I'm connecting you both on NexusB2B. I'll step back now — type /ai anytime to call me."
}

export async function answerQuery(question: string): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction:
      'You are a professional B2B business assistant on NexusB2B. Answer questions concisely and helpfully in a professional tone. You have no knowledge of the ongoing conversation — answer only what is asked.',
  })

  const result = await model.generateContent(question)
  return result.response.text() || 'I was unable to process your question. Please try again.'
}
