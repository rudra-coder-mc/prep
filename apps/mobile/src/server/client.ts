import { z } from 'zod'

/**
 * The device endpoints, and the only place in the app that knows their
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
    /** What the server answered, or null when it was never reached. */
    readonly status: number | null = null,
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

const recordingsSchema = z.object({
  recordings: z.array(z.object({ key: z.string().min(1), bytes: z.number().int().nonnegative() })),
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
  /**
   * What each key's recording weighs, leaving out the keys nothing has been
   * recorded for. The caller asks about a whole track at once.
   */
  audioSizes(keys: string[]): Promise<Map<string, number>>
  /** One recording, or null when the server has not made it yet. */
  downloadAudio(key: string): Promise<Uint8Array | null>
}

/**
 * How many keys go in one question. The endpoint takes twice this, so a track
 * of a few thousand recordings is a handful of small requests rather than one
 * body the size of the answer.
 */
const KEYS_PER_REQUEST = 500

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

    async audioSizes(keys) {
      const sizes = new Map<string, number>()

      for (let at = 0; at < keys.length; at += KEYS_PER_REQUEST) {
        const batch = keys.slice(at, at + KEYS_PER_REQUEST)
        const response = await send('/api/device/audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keys: batch }),
        })

        const parsed = recordingsSchema.safeParse(await response.json().catch(() => null))
        if (!parsed.success) throw notOurServer('/api/device/audio')

        for (const { key, bytes } of parsed.data.recordings) sizes.set(key, bytes)
      }

      return sizes
    },

    async downloadAudio(key) {
      let response: Response
      try {
        response = await send(`/api/device/audio/${key}`)
      } catch (error) {
        // A key with no recording is the ordinary answer to this question
        // rather than a failure: the track has not been narrated yet, and the
        // caller carries on to the next key.
        if (error instanceof ServerError && error.status === 404) return null
        throw error
      }

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

  return new ServerError(kind, message, response.status)
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
