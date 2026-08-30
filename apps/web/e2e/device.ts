import { expect, type APIRequestContext } from '@playwright/test'

const EMAIL = process.env.SEED_USER_EMAIL ?? 'e2e@prep.test'
const PASSWORD = process.env.SEED_USER_PASSWORD ?? 'e2e-password'

/**
 * The bearer token every device spec runs on, signed in for once and held.
 *
 * A device signs in on first run and carries the token for thirty days, so one
 * login for the whole suite is what actually happens rather than a shortcut.
 * It also has to be one: better-auth allows three sign-ins per ten seconds, and
 * with no client IP to key on behind Playwright's own server they all share a
 * single bucket, so a fourth spec that signed in for itself would fail the ones
 * around it. Signing in is device-session.spec.ts's own subject, and that spec
 * does it for real.
 */
let signedIn: Promise<string> | undefined

export function deviceToken(request: APIRequestContext): Promise<string> {
  signedIn ??= signIn(request)
  return signedIn
}

export async function deviceHeaders(
  request: APIRequestContext,
): Promise<{ authorization: string }> {
  return { authorization: `Bearer ${await deviceToken(request)}` }
}

async function signIn(request: APIRequestContext): Promise<string> {
  const login = await request.post('/api/device/session', {
    data: { email: EMAIL, password: PASSWORD },
  })
  expect(login.status()).toBe(200)
  return (await login.json()).token as string
}
