import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
const COOKIE_NAME = process.env.COOKIE_NAME || 'strengthquest_session'

// Add any public routes that don't require authentication
const publicRoutes = [
  ...(process.env.NODE_ENV === 'development' ? ['/'] : []),
  '/login',
  '/api/auth/magic-link',
  '/api/auth/verify',
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

  // Check for auth token
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) {
    return redirectToLogin(request)
  }

  try {
    // Verify token
    await jwtVerify(token, JWT_SECRET)
    return NextResponse.next()
  } catch (error) {
    console.error('Auth error:', error)
    return redirectToLogin(request)
  }
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?from=${encodeURIComponent(request.nextUrl.pathname)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * 1. /api/auth/* (authentication routes)
     * 2. /_next/* (Next.js internals)
     * 3. /static/* (static files)
     * 4. /*.* (files with extensions)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico).*)'
  ]
} 