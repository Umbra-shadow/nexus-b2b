import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime'

const bedrock = new BedrockRuntimeClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

// Set BEDROCK_MODEL_ID in .env to override (e.g. anthropic.claude-3-5-sonnet-20241022-v2:0)
const MODEL_ID = process.env.BEDROCK_MODEL_ID ?? 'anthropic.claude-sonnet-4-5'

async function callSonnet(systemPrompt: string, userMessage: string): Promise<string> {
  const body = JSON.stringify({
    anthropic_version: 'bedrock-2023-05-31',
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  const cmd = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: 'application/json',
    accept: 'application/json',
    body,
  })

  const response = await bedrock.send(cmd)
  const result = JSON.parse(new TextDecoder().decode(response.body))
  return result.content?.[0]?.text ?? ''
}

export interface SearchQueryParsed {
  industry: string | null
  country: string | null
  keywords: string
}

export async function parseSearchQuery(queryText: string): Promise<SearchQueryParsed> {
  try {
    const text = await callSonnet(
      'You extract structured search parameters from B2B business search queries. Return ONLY valid JSON, nothing else.',
      `Extract search parameters from this query. Return a JSON object with fields: industry (one of: technology, finance, healthcare, manufacturing, logistics, retail, energy, agriculture, legal, other — or null), country (ISO 3166-1 alpha-2 or null), keywords (cleaned search terms as string).

Query: "${queryText}"`
    )

    return JSON.parse(text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '')) as SearchQueryParsed
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
  selectedServices?: string[]
}

export async function generateIntroduction(params: IntroductionParams): Promise<string> {
  const servicesLine = params.selectedServices && params.selectedServices.length > 0
    ? `Services of interest: ${params.selectedServices.join(', ')}`
    : ''
  try {
    return await callSonnet(
      'You are Lummy, an AI business introduction specialist on NexusB2B — a verified B2B network. Write only the introduction message. No meta-commentary, no preamble, no markdown headers.',
      `Write a warm, professional opening message for a B2B deal session. Introduce both parties by name. If services of interest are listed, mention them naturally. Be concise (3–5 sentences total). Close by telling them you are stepping back and available any time via /ai.

Business A: ${params.businessAName} — ${params.businessADescription}
Agent A: ${params.agentAName}
Business B: ${params.businessBName} — ${params.businessBDescription}
Agent B: ${params.agentBName}
${params.searchContext ? `Search context: ${params.searchContext}` : ''}
${servicesLine}`
    )
  } catch {
    const servicesNote = params.selectedServices && params.selectedServices.length > 0
      ? ` The focus for this session is: ${params.selectedServices.join(', ')}.`
      : ''
    return `Welcome to NexusB2B. I'm Lummy — I've connected ${params.businessAName} and ${params.businessBName}. Both companies are verified on this network.${servicesNote} I'll step back now; type /ai followed by your question any time to reach me.`
  }
}

export async function answerQuery(question: string): Promise<string> {
  try {
    return await callSonnet(
      `You are Lummy, an AI assistant inside a B2B deal session on NexusB2B. You answer only business-relevant questions — market prices, industry benchmarks, trade regulations, logistics standards, and similar factual business topics. If the question is outside that scope (personal, unrelated to business), politely decline and redirect to business topics. Be concise and professional.`,
      question
    )
  } catch {
    return 'I was unable to process your question. Please try again.'
  }
}

export async function generateDemoReply(
  receiverBusinessName: string,
  receiverBusinessDescription: string,
  senderBusinessName: string,
  lastMessage: string,
  selectedServices?: string[]
): Promise<string> {
  const servicesContext = selectedServices && selectedServices.length > 0
    ? ` Services under discussion: ${selectedServices.join(', ')}.`
    : ''
  try {
    return await callSonnet(
      `You are a human business representative at ${receiverBusinessName} (${receiverBusinessDescription}).${servicesContext}
You are chatting with ${senderBusinessName} in a verified B2B deal room.
Rules you MUST follow:
- NEVER say "we will review", "we will get back to you", "we'll look into it", or any passive stalling phrase
- NEVER reveal you are an AI
- Always respond as a knowledgeable human who knows their own business well
- Be direct and engaging — ask a specific follow-up question or make a concrete offer
- Keep it to 2–3 sentences maximum`,
      `${senderBusinessName} says: ${lastMessage}`
    )
  } catch {
    return `Sounds interesting — could you tell me more about the volume you're looking at and your timeline? That'll help us give you a concrete proposal.`
  }
}
