import { describe, expect, it } from 'vitest'
import { createServerClient, ServerError } from './client'

/**
 * The wire between the phone and the four device endpoints.
 *
 * What matters here is the failure telling, not the happy path: an unreachable
 * server and a refused password have to stay different answers, because one of
 * them means "carry on with what you hold" and the other means "ask for the
 * password again". Whether the shapes match the real endpoints is settled by the
 * integration test beside the routes, not here.
 */

const BASE = 'https://work'

type Handler = (request: Request) => Response | Promise<Response>

function clientWith(handler: Handler, token: string | null = 'a-token') {
  const seen: Request[] = []
  const client = createServerClient({
    baseUrl: BASE,
    token,
    fetch: async (input, init) => {
      const request = new Request(input as string, init)
      seen.push(request)
      return handler(request)
    },
  })
  return { client, seen }
}

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers })
}

const SESSION = {
  token: 'a-token',
  expiresAt: '2026-09-29T10:00:00.000Z',
  user: { id: 'u1', email: 'atul@prep.test', name: 'Atul' },
}

describe('signing in', () => {
  it('sends the credentials and reads back the session', async () => {
    const { client, seen } = clientWith(() => json(SESSION), null)

    const session = await client.signIn('atul@prep.test', 'a-password')

    expect(session.token).toBe('a-token')
    expect(session.expiresAt).toEqual(new Date(SESSION.expiresAt))
    expect(session.user.email).toBe('atul@prep.test')

    const request = seen[0]!
    expect(request.url).toBe(`${BASE}/api/device/session`)
    expect(request.method).toBe('POST')
    expect(await request.json()).toEqual({ email: 'atul@prep.test', password: 'a-password' })
  })

  it('calls refused credentials unauthorised', async () => {
    const { client } = clientWith(
      () => json({ error: 'Those credentials were refused' }, 401),
      null,
    )

    await expect(client.signIn('atul@prep.test', 'wrong')).rejects.toMatchObject({
      kind: 'unauthorised',
      message: 'Those credentials were refused',
    })
  })

  // Typing the address wrong and typing the password wrong have to read
  // differently, or the password gets retyped forever.
  it('passes a complaint about the request through as a refusal', async () => {
    const { client } = clientWith(() => json({ error: 'Send an email and a password' }, 400), null)

    await expect(client.signIn('not-an-address', 'a-password')).rejects.toMatchObject({
      kind: 'refused',
      message: 'Send an email and a password',
    })
  })
})

describe('checking the session', () => {
  it('carries the token as a bearer header', async () => {
    const { client, seen } = clientWith(() =>
      json({ expiresAt: SESSION.expiresAt, user: SESSION.user }),
    )

    const checked = await client.checkSession()

    expect(checked.expiresAt).toEqual(new Date(SESSION.expiresAt))
    expect(seen[0]!.headers.get('authorization')).toBe('Bearer a-token')
  })

  it('is unauthorised once the token has expired', async () => {
    const { client } = clientWith(() => json({ error: 'Sign in again' }, 401))

    await expect(client.checkSession()).rejects.toMatchObject({ kind: 'unauthorised' })
  })
})

describe('the archive', () => {
  it('reads the version and what a refresh would cost', async () => {
    const { client, seen } = clientWith(() =>
      json({
        version: 'abc123',
        bytes: 934_000,
        topics: 46,
        questions: 563,
        exercises: 92,
        narrationSections: 291,
      }),
    )

    const version = await client.archiveVersion()

    expect(version).toEqual({
      version: 'abc123',
      bytes: 934_000,
      topics: 46,
      questions: 563,
      exercises: 92,
      narrationSections: 291,
    })
    expect(seen[0]!.url).toBe(`${BASE}/api/device/archive/version`)
  })

  it('downloads the archive as bytes', async () => {
    const packed = new Uint8Array([80, 75, 3, 4, 9, 9])
    const { client } = clientWith(
      () => new Response(packed, { headers: { 'Content-Type': 'application/zip' } }),
    )

    expect(await client.downloadArchive()).toEqual(packed)
  })

  // A server with nothing built is a server that will have something later, so
  // it must not read as an error in the app or in the credentials.
  it('says the server has nothing built rather than failing outright', async () => {
    const { client } = clientWith(() => json({ error: 'No content archive has been built' }, 503))

    await expect(client.archiveVersion()).rejects.toMatchObject({ kind: 'unavailable' })
  })
})

describe('when the server cannot be reached', () => {
  it('calls a failed connection offline rather than a refusal', async () => {
    const { client } = clientWith(() => {
      throw new TypeError('Network request failed')
    })

    await expect(client.archiveVersion()).rejects.toMatchObject({ kind: 'offline' })
  })

  it('calls an answer in the wrong shape offline too, since the address is the likely cause', async () => {
    const { client } = clientWith(() => new Response('<html>a router login page</html>'))

    const error = await client.archiveVersion().catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ServerError)
    expect((error as ServerError).kind).toBe('offline')
  })
})
