import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic gate. It only checks for the session cookie, so it is cheap enough
 * to run on every request; pages and actions still verify the session properly.
 */
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  // Redirecting an API call to the login page answers a request for audio with
  // a page of HTML and a 200, which is worse than useless to whatever was
  // fetching it. Endpoints get a status they can act on.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  }

  const login = new URL('/login', request.url)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)'],
}
