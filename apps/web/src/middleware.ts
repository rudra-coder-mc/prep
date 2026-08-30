import { getSessionCookie } from 'better-auth/cookies'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Optimistic gate. It only checks that a session is claimed, so it is cheap
 * enough to run on every request; pages, actions and endpoints still verify the
 * session properly.
 */
export function middleware(request: NextRequest) {
  if (getSessionCookie(request)) return NextResponse.next()

  // Redirecting an API call to the login page answers a request for audio with
  // a page of HTML and a 200, which is worse than useless to whatever was
  // fetching it. Endpoints get a status they can act on.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // A device has no cookie jar and carries its session in a header instead.
    // Whether the token is any good is the endpoint's question, not this one's.
    if (request.headers.get('authorization')) return NextResponse.next()

    return NextResponse.json({ error: 'Sign in first' }, { status: 401 })
  }

  const login = new URL('/login', request.url)
  return NextResponse.redirect(login)
}

export const config = {
  // `api/device/session` is where a device signs in, so it cannot require a
  // session to reach, for the same reason `api/auth` cannot.
  matcher: ['/((?!login|api/auth|api/device/session|_next/static|_next/image|favicon.ico).*)'],
}
