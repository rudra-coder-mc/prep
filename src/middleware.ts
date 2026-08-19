import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic gate. It only checks for the session cookie, so it is cheap enough
 * to run on every request; pages and actions still verify the session properly.
 */
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  const login = new URL('/login', request.url)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
