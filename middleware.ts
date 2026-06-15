import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/session'

const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/reset-password',
  '/auth/accept-invite',
  '/api/auth',
]

const RATE_LIMIT_PATHS = ['/api/auth/register', '/api/auth/reset-password', '/auth/login']

const rateLimitMap = new Map<string, { count: number; reset: number }>()

function rateLimit(ip: string, path: string): boolean {
  if (!RATE_LIMIT_PATHS.some((p) => path.startsWith(p))) return false

  const key = `${ip}:${path}`
  const now = Date.now()
  const window = 60_000
  const max = 10

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

  if (rateLimit(ip, pathname)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/')
  )

  if (isPublic) return NextResponse.next()

  const session = await auth()
  if (!session?.user) {
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
