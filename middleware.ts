import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

  if (rateLimit(ip, pathname, req.method)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isPublic) return NextResponse.next()

  // getToken reads the JWT cookie without touching the database — safe for edge runtime.
  // NextAuth v5 with NEXTAUTH_SECRET set uses the v4 cookie name (next-auth.session-token).
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = req.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
