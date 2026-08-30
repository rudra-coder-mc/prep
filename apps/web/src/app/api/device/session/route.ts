import { auth } from '@/lib/auth'

/**
 * The credential a device holds. A phone has no browser to keep a cookie in, so
 * it signs in once here, stores the token it gets back, and sends it as
 * `Authorization: Bearer <token>` on everything afterwards.
 *
 * See docs/decisions/0040-a-device-carries-its-session-in-a-header.md.
 */

/**
 * Signs a device in, and the one request in the app that carries a password.
 *
 * The password is checked by better-auth's own sign-in endpoint rather than
 * beside it, so a device gets the same treatment the browser does and there is
 * one place a credential is ever verified. What is different is the answer: the
 * browser is given a cookie, and a device is given the token to hold itself.
 */
export async function POST(request: Request): Promise<Response> {
  const credentials = await readCredentials(request)
  if (!credentials) return problem(400, 'Send an email and a password')

  const signIn = await auth.handler(
    new Request(new URL('/api/auth/sign-in/email', request.url), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    }),
  )

  if (!signIn.ok) {
    // better-auth answers a wrong password and an unknown address the same way,
    // deliberately, and this passes that on rather than narrowing it. A
    // complaint about the request itself is a different answer and stays one,
    // so a device is never told to re-enter a password over a malformed field.
    if (signIn.status === 401 || signIn.status === 403) {
      return problem(401, 'Those credentials were refused')
    }
    return problem(signIn.status, await messageFrom(signIn))
  }

  // Set by the bearer plugin on any response that issues a session. The browser
  // never sees it: apps/web/src/app/api/auth/[...all]/route.ts strips it there.
  const token = signIn.headers.get('set-auth-token')
  if (!token) throw new Error('better-auth issued a session without a bearer token')

  const session = await sessionFrom(new Headers({ authorization: `Bearer ${token}` }))
  if (!session) return problem(401, 'Those credentials were refused')

  return Response.json({ token, ...session }, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Says whether the token is still good and how long it has left, and moves the
 * expiry forward as a side effect, which is the only thing keeping a device
 * signed in. The token itself never changes, so a device that sees a 200 has
 * nothing to store.
 */
export async function GET(request: Request): Promise<Response> {
  const session = await sessionFrom(request.headers)
  if (!session) return problem(401, 'Sign in again')

  return Response.json(session, { headers: { 'Cache-Control': 'no-store' } })
}

async function sessionFrom(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session) return null

  return {
    expiresAt: session.session.expiresAt.toISOString(),
    user: { id: session.user.id, email: session.user.email, name: session.user.name },
  }
}

async function readCredentials(
  request: Request,
): Promise<{ email: string; password: string } | null> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return null
  }

  if (typeof body !== 'object' || body === null) return null
  const { email, password } = body as Record<string, unknown>
  if (typeof email !== 'string' || typeof password !== 'string') return null
  if (email === '' || password === '') return null

  return { email, password }
}

async function messageFrom(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'message' in body) {
      const { message } = body as { message?: unknown }
      if (typeof message === 'string') return message
    }
  } catch {
    // Falls through to the generic answer below.
  }
  return 'That request was refused'
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
