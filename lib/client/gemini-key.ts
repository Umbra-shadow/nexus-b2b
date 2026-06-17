const LS_KEY = 'NEXUSB2B_GEMINI_KEY'

export function getGeminiKey(): string {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(LS_KEY) ?? ''
}

export function geminiHeaders(): Record<string, string> {
  const key = getGeminiKey()
  return key ? { 'x-gemini-key': key } : {}
}
