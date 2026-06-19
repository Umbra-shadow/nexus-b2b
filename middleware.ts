import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/accept-invite',
  '/api/auth',
  // Public marketing / informational pages
  '/platform',
  '/about',
  '/careers',
  '/contact',
  '/press',
  '/security',
  '/privacy',
  '/terms',
  '/status',
  '/help',
  '/support',
]

// Only rate-limit POST requests on auth mutation endpoints (not page navigations)
const RATE_LIMIT_PATHS = ['/api/auth/register', '/api/auth/reset-password', '/api/auth/signin']

const rateLimitMap = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, path: string, method: string): boolean {
  if (method !== 'POST') return false
  if (!RATE_LIMIT_PATHS.some((p) => path.startsWith(p))) return false

  const key = `${ip}:${path}`
  const now = Date.now()
  const window = 60_000
  const max = 15

  const entry = rateLimitMap.get(key)
  if (!entry || now > entry.reset) {
    rateLimitMap.set(key, { count: 1, reset: now + window })
    return false
  }

  entry.count++
  if (entry.count > max) return true
  return false
}

export default auth((req) => {
  const { pathname } = req.nextUrl
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (rateLimit(ip, pathname, req.method)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isPublic) return NextResponse.next()

  // req.auth is populated by NextAuth v5 — null means no valid session
  if (!req.auth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
