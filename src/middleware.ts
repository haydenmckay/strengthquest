import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { rateLimit } from './lib/rateLimit'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
const COOKIE_NAME = process.env.COOKIE_NAME || 'strengthquest_session'

// Add any public routes that don't require authentication
const publicRoutes = [
  ...(process.env.NODE_ENV === 'development' ? ['/'] : []),
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/magic-link',
  '/api/auth/verify',
  '/api/auth/session',
  '/auth/verify'
]

export async function middleware(request: NextRequest) {
  // Skip authentication in development
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }

  const pathname = request.nextUrl.pathname

  // Allow public routes
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next()
  }

  // Apply rate limiting to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const ip = request.ip ?? '127.0.0.1'
    const { isRateLimited, remaining } = rateLimit(ip)

    if (isRateLimited) {
      return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': remaining.toString(),
        },
      })
    }

    // Add rate limit headers to the response
    const response = NextResponse.next()
    response.headers.set('X-RateLimit-Remaining', remaining.toString())
    return response
  }

  // Handle authentication for protected routes
  if (request.nextUrl.pathname.startsWith('/dashboard') ||
      request.nextUrl.pathname.startsWith('/profile')) {
    const token = request.cookies.get(COOKIE_NAME)?.value

    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }

    try {
      await jwtVerify(token, JWT_SECRET)
      return NextResponse.next()
    } catch {
      const url = new URL('/login', request.url)
      url.searchParams.set('from', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/profile/:path*'
  ]
} 