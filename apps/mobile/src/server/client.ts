import { z } from 'zod'

/**
 * The four device endpoints, and the only place in the app that knows their
 * shapes. Everything here is passed its `fetch` rather than reaching for the
 * global one, so the whole client runs off a device.
 *
 * See docs/decisions/0040-a-device-carries-its-session-in-a-header.md for the
 * credential and `0041` for what the archive endpoints promise.
 */

/**
 * Why a request failed, which is the part callers act on.
 *
 * The split that matters is `offline` against everything else. A phone that
 * cannot reach the server carries on with what it holds and says nothing; a
 * phone that reached the server and was refused has something to tell the
 * person holding it.
 */
export type ServerFailure = 'offline' | 'unauthorised' | 'unavailable' | 'refused'

export class ServerError extends Error {
  constructor(
    readonly kind: ServerFailure,
    message: string,
  ) {
    super(message)
    this.name = 'ServerError'
  }
}

const sessionSchema = z.object({
  token: z.string().min(1),
  expiresAt: z.iso.datetime(),
  user: z.object({ id: z.string(), email: z.string(), name: z.string() }),
})

const checkSchema = sessionSchema.omit({ token: true })

const versionSchema = z.object({
  version: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  topics: z.number().int().nonnegative(),
  questions: z.number().int().nonnegative(),
  exercises: z.number().int().nonnegative(),
  narrationSections: z.number().int().nonnegative(),
})

export type DeviceSession = {
  token: string
  expiresAt: Date
  user: { id: string; email: string; name: string }
}

export type ArchiveVersion = z.infer<typeof versionSchema>

export type ServerClientOptions = {
  baseUrl: string
  /** Null while signing in, which is the one request that has no session yet. */
  token: string | null
  fetch: typeof globalThis.fetch
}

export type ServerClient = {
  signIn(email: string, password: string): Promise<DeviceSession>
  checkSession(): Promise<Omit<DeviceSession, 'token'>>
  archiveVersion(): Promise<ArchiveVersion>
  downloadArchive(): Promise<Uint8Array>
}

export function createServerClient({ baseUrl, token, fetch }: ServerClientOptions): ServerClient {
  async function send(path: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers)
    if (token) headers.set('authorization', `Bearer ${token}`)

    let response: Response
    try {
      response = await fetch(`${baseUrl}${path}`, { ...init, headers })
    } catch (error) {
      // Everything from a sleeping machine to a network that dropped mid-request
      // arrives here as one thrown TypeError, and the app does the same thing
      // about all of them.
      throw new ServerError('offline', `${baseUrl} could not be reached: ${describe(error)}`)
    }

    if (!response.ok) throw await failure(response)
    return response
  }

  async function readJson<T>(path: string, schema: z.ZodType<T>): Promise<T> {
    const response = await send(path)

    let body: unknown
    try {
      body = await response.json()
    } catch {
      throw notOurServer(path)
    }

    const parsed = schema.safeParse(body)
    if (!parsed.success) throw notOurServer(path)
    return parsed.data
  }

  /**
   * An answer this app cannot read means the address is pointing at something
   * that is not the server, which is the same situation as not reaching it: keep
   * working from what is held. The message says which it was, so the difference
   * is still legible to whoever is looking at the screen.
   */
  function notOurServer(path: string): ServerError {
    return new ServerError('offline', `${baseUrl}${path} did not answer like the prep server`)
  }

  return {
    async signIn(email, password) {
      const response = await send('/api/device/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const parsed = sessionSchema.safeParse(await response.json().catch(() => null))
      if (!parsed.success) throw notOurServer('/api/device/session')

      return { ...parsed.data, expiresAt: new Date(parsed.data.expiresAt) }
    },

    async checkSession() {
      const checked = await readJson('/api/device/session', checkSchema)
      return { ...checked, expiresAt: new Date(checked.expiresAt) }
    },

    archiveVersion() {
      return readJson('/api/device/archive/version', versionSchema)
    },

    async downloadArchive() {
      const response = await send('/api/device/archive')
      return new Uint8Array(await response.arrayBuffer())
    },
  }
}

/**
 * The server's own words when it gave any, because it says the useful thing:
 * which credential was refused, or that no archive has been built yet.
 */
async function failure(response: Response): Promise<ServerError> {
  const kind: ServerFailure =
    response.status === 401 ? 'unauthorised' : response.status === 503 ? 'unavailable' : 'refused'

  let message = `The server answered ${response.status}`
  try {
    const body: unknown = await response.json()
    if (typeof body === 'object' && body !== null && 'error' in body) {
      const { error } = body as { error?: unknown }
      if (typeof error === 'string' && error !== '') message = error
    }
  } catch {
    // Falls through to the status line above.
  }

  return new ServerError(kind, message)
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
