import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { session as sessionTable, user } from '@/db/schema'
import { createTestDatabase, useTestDatabase, type TestDatabase } from '@/db/testing'
import { createAccount } from '@/lib/account'
import { GET, POST } from './route'
import { POST as authRoute } from '@/app/api/auth/[...all]/route'

/**
 * The device credential, run against a real database and the real better-auth,
 * because everything worth checking here is what better-auth does with a token
 * rather than what this route says about it.
 *
 * See docs/decisions/0040-a-device-carries-its-session-in-a-header.md.
 */
let ctx: TestDatabase
let restore: () => Promise<void>

const EMAIL = 'device@prep.test'
const PASSWORD = 'a-password-long-enough'
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000

beforeAll(async () => {
  ctx = await createTestDatabase()
  restore = await useTestDatabase(ctx)
}, 60_000)

afterAll(async () => {
  await restore?.()
  await ctx?.drop()
})

beforeEach(async () => {
  await ctx.db.delete(user)
  await createAccount(EMAIL, PASSWORD)
})

function signIn(body: unknown): Promise<Response> {
  return POST(
    new Request('http://localhost/api/device/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  )
}

function check(token: string): Promise<Response> {
  return GET(
    new Request('http://localhost/api/device/session', {
      headers: { authorization: `Bearer ${token}` },
    }),
  )
}

async function tokenFor(): Promise<string> {
  const response = await signIn({ email: EMAIL, password: PASSWORD })
  expect(response.status).toBe(200)
  return (await response.json()).token
}

/**
 * Rewinds the one session so it looks like one last used `days` ago.
 *
 * By user rather than by token, because the token a device holds is the signed
 * form and the column holds the raw one. A test that took them for the same
 * string would pass while updating nothing.
 */
async function lastUsed(days: number) {
  await ctx.db
    .update(sessionTable)
    .set({ expiresAt: new Date(Date.now() + THIRTY_DAYS - days * 24 * 60 * 60 * 1000) })
}

/** The stored expiry, or undefined once better-auth has dropped the session. */
async function storedExpiry(): Promise<Date | undefined> {
  const rows = await ctx.db.select().from(sessionTable)
  return rows[0]?.expiresAt
}

describe('signing a device in', () => {
  it('answers with a token, an expiry and the account', async () => {
    const response = await signIn({ email: EMAIL, password: PASSWORD })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.token).toEqual(expect.any(String))
    expect(body.user.email).toBe(EMAIL)
    // Thirty days, give or take the time the request took.
    expect(Date.parse(body.expiresAt) - Date.now()).toBeGreaterThan(THIRTY_DAYS - 60_000)
  })

  it('refuses a wrong password without saying it was the password', async () => {
    const response = await signIn({ email: EMAIL, password: 'not-the-password' })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Those credentials were refused' })
  })

  it('refuses an unknown address the same way', async () => {
    const response = await signIn({ email: 'nobody@prep.test', password: PASSWORD })

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Those credentials were refused' })
  })

  it('rejects a body that is not a pair of credentials', async () => {
    expect((await signIn({ email: EMAIL })).status).toBe(400)
    expect((await signIn({ email: '', password: '' })).status).toBe(400)
  })

  // A device told to re-enter its password over a typo in the address would
  // retype the password forever, so a complaint about the request stays a 400.
  it('calls a malformed address a bad request rather than a refusal', async () => {
    const response = await signIn({ email: 'not-an-address', password: PASSWORD })

    expect(response.status).toBe(400)
  })
})

describe('carrying the token', () => {
  it('is accepted as a bearer token on a request with no cookie', async () => {
    const token = await tokenFor()

    const response = await check(token)

    expect(response.status).toBe(200)
    expect((await response.json()).user.email).toBe(EMAIL)
  })

  it('refuses a token nothing issued', async () => {
    const response = await check('not-a-token')

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Sign in again' })
  })

  it('refuses a request carrying nothing at all', async () => {
    const response = await GET(new Request('http://localhost/api/device/session'))

    expect(response.status).toBe(401)
  })
})

describe('staying signed in', () => {
  it('moves the expiry forward on a session last used a while ago', async () => {
    const token = await tokenFor()
    await lastUsed(5)

    const response = await check(token)
    const { expiresAt } = await response.json()

    expect(Date.parse(expiresAt) - Date.now()).toBeGreaterThan(THIRTY_DAYS - 60_000)
  })

  // Without this the test above passes on a route that reports thirty days
  // whatever the session says.
  it('leaves a session used a moment ago alone', async () => {
    const token = await tokenFor()
    const before = await storedExpiry()

    await check(token)

    expect(await storedExpiry()).toEqual(before)
  })

  it('keeps the same token, so a device stores it once and never again', async () => {
    const token = await tokenFor()
    await lastUsed(5)

    await check(token)

    expect((await check(token)).status).toBe(200)
  })

  it('refuses a session that went thirty days without reaching the server', async () => {
    const token = await tokenFor()
    await lastUsed(31)

    const response = await check(token)

    expect(response.status).toBe(401)
    expect(await response.json()).toEqual({ error: 'Sign in again' })
  })
})

describe('the browser login', () => {
  it('sets a cookie and never a token a script could read', async () => {
    const response = await authRoute(
      new Request('http://localhost/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
      }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('set-cookie')).toContain('session_token')
    expect(response.headers.get('set-auth-token')).toBeNull()
  })
})
