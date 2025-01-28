import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { rateLimit } from './lib/rateLimit'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'default-secret-key')
const COOKIE_NAME = process.env.COOKIE_NAME || 'strengthquest_session'

// Add any public routes that don't require authentication
const publicRoutes = [
  '/login',
  '/signup',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/magic-link',
  '/api/auth/verify',
  '/api/auth/session',
  '/auth/verify'
]

// Add routes that require authentication
const protectedRoutes = ['/', '/settings', '/profile', '/workouts', '/dashboard']
const authRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Allow public routes and static files
  if (publicRoutes.includes(pathname) || 
      pathname.startsWith('/_next/') || 
      pathname.includes('.')) {
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

  // Get the token from cookies
  const token = request.cookies.get(COOKIE_NAME)?.value

  // If no token and trying to access any route (except public routes),
  // redirect to login
  if (!token) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Check if the route requires authentication
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  try {
    // Verify the token
    const verified = await jwtVerify(token, JWT_SECRET)
    const isValid = !!verified.payload.userId

    if (!isValid) {
      // If token is invalid, redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Token is valid, allow access
    return NextResponse.next()
  } catch (error) {
    // If token verification fails, redirect to login
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 