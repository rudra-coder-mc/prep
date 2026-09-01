import { z } from 'zod'
import { RESULTS, TIERS, type Result, type Tier } from '@prep/core'

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

/**
 * The sync's wire shape, which is the one endpoint that both sends and receives
 * the same three collections. Dates are ISO-8601 strings on the wire and `Date`
 * everywhere else, the way the rest of this client works. The merge rules are
 * in ../sync/sync.ts and
 * docs/decisions/0042-progress-is-exchanged-and-the-schedule-is-rebuilt.md.
 */
const syncAttemptSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  topicSlug: z.string().min(1),
  answer: z.string(),
  result: z.enum(RESULTS),
  confidence: z.number(),
  hintsUsed: z.number(),
  notes: z.string().nullable(),
  attemptedAt: z.iso.datetime(),
})

const syncSchema = z.object({
  syncedAt: z.iso.datetime(),
  attempts: z.array(syncAttemptSchema),
  topicProgress: z.array(z.object({ topicSlug: z.string().min(1), learnedAt: z.iso.datetime() })),
  trackTiers: z.array(
    z.object({ technology: z.string().min(1), tier: z.enum(TIERS), updatedAt: z.iso.datetime() }),
  ),
})

export type SyncAttempt = {
  /** Made where the answer was given, and the whole of the attempt's identity. */
  id: string
  questionId: string
  topicSlug: string
  answer: string
  result: Result
  confidence: number
  hintsUsed: number
  notes: string | null
  attemptedAt: Date
}

export type SyncLearnedMark = { topicSlug: string; learnedAt: Date }
export type SyncTierPick = { technology: string; tier: Tier; updatedAt: Date }

export type SyncRequest = {
  device: { id: string; name: string }
  /** The `syncedAt` of this device's last exchange, or null if it has never had one. */
  since: Date | null
  attempts: SyncAttempt[]
  topicProgress: SyncLearnedMark[]
  trackTiers: SyncTierPick[]
}

export type SyncResponse = {
  /** What the device sends back as `since` next time. */
  syncedAt: Date
  attempts: SyncAttempt[]
  topicProgress: SyncLearnedMark[]
  trackTiers: SyncTierPick[]
}

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
  /** Everything this device has that the server does not, and everything back. */
  sync(request: SyncRequest): Promise<SyncResponse>
}

/**
 * How many keys go in one question. The endpoint takes twice this, so a track
 * of a few thousand recordings is a handful of small requests rather than one
 * body the size of the answer.
 */
const KEYS_PER_REQUEST = 500

/**
 * How long an exchange is given before it is abandoned.
 *
 * React Native's fetch has no timeout of its own: OkHttpClientProvider.kt sets
 * the connect, read and write timeouts to zero. A laptop that goes to sleep
 * halfway through a request leaves the promise pending for as long as the app
 * runs, and the app allows one exchange at a time, so without this the first
 * hung sync would be the last one of that launch.
 *
 * Nothing else here is given one. A sync is kilobytes and nobody is watching it;
 * an archive or a track of audio is megabytes and somebody is.
 */
const SYNC_TIMEOUT_MS = 30_000

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

  async function exchange(request: SyncRequest, signal: AbortSignal): Promise<SyncResponse> {
    const response = await send('/api/device/sync', {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device: request.device,
        since: request.since?.toISOString() ?? null,
        attempts: request.attempts.map((attempt) => ({
          ...attempt,
          attemptedAt: attempt.attemptedAt.toISOString(),
        })),
        topicProgress: request.topicProgress.map((mark) => ({
          ...mark,
          learnedAt: mark.learnedAt.toISOString(),
        })),
        trackTiers: request.trackTiers.map((pick) => ({
          ...pick,
          updatedAt: pick.updatedAt.toISOString(),
        })),
      }),
    })

    const parsed = syncSchema.safeParse(await response.json().catch(() => null))
    if (!parsed.success) throw notOurServer('/api/device/sync')

    return {
      syncedAt: new Date(parsed.data.syncedAt),
      attempts: parsed.data.attempts.map((attempt) => ({
        ...attempt,
        attemptedAt: new Date(attempt.attemptedAt),
      })),
      topicProgress: parsed.data.topicProgress.map((mark) => ({
        ...mark,
        learnedAt: new Date(mark.learnedAt),
      })),
      trackTiers: parsed.data.trackTiers.map((pick) => ({
        ...pick,
        updatedAt: new Date(pick.updatedAt),
      })),
    }
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

    async sync(request) {
      const abandon = new AbortController()
      const timer = setTimeout(() => abandon.abort(), SYNC_TIMEOUT_MS)

      try {
        return await exchange(request, abandon.signal)
      } catch (error) {
        if (!abandon.signal.aborted) throw error
        throw new ServerError(
          'offline',
          `${baseUrl} took longer than ${SYNC_TIMEOUT_MS / 1000} seconds to answer a sync`,
        )
      } finally {
        clearTimeout(timer)
      }
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
