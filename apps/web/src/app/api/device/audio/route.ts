import { z } from 'zod'
import { auth } from '@/lib/auth'
import { cachedAudioSize } from '@/lib/speech'

/**
 * What a set of recordings weighs, for a device deciding whether to start a
 * download.
 *
 * The phone holds every key in the archive but no idea what any of them costs,
 * and the library is hundreds of megabytes against a phone's storage. Asking
 * `GET /api/device/audio/<key>` to find out would download the track to measure
 * it. So this reports sizes and nothing else, and a key that has never been
 * recorded is simply absent from the answer rather than being an error: it is
 * the same shrug the `GET` gives, in a form the caller can count. See
 * docs/decisions/0044-a-device-is-told-what-a-track-of-audio-weighs.md.
 *
 * A POST that only reads, because the question is a list of a thousand
 * sha256 keys and that does not fit in a URL.
 */

/**
 * More than any one request needs, and small enough that the body stays a few
 * tens of kilobytes. The phone asks in batches well under this, so tripping it
 * means something other than the app is calling.
 */
const MAX_KEYS = 1000

const requestSchema = z.object({
  keys: z.array(z.string().regex(/^[0-9a-f]{64}$/, 'must be a sha256 digest')).max(MAX_KEYS),
})

export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problem(400, 'Send the keys as JSON')
  }

  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return problem(400, `That is not a list of keys: ${z.prettifyError(parsed.error)}`)
  }

  // Duplicates are ordinary: one script read by two topics is one key, and the
  // caller counts the answer rather than matching it up position by position.
  const keys = [...new Set(parsed.data.keys)]
  const sizes = await Promise.all(keys.map((key) => cachedAudioSize(key)))

  const recordings = keys.flatMap((key, index) => {
    const bytes = sizes[index]
    return bytes === null || bytes === undefined ? [] : [{ key, bytes }]
  })

  return Response.json(
    { recordings },
    // What has been recorded changes when `npm run narration:build` runs, so an
    // answer held onto would tell a phone a track was short of recordings it
    // now has.
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
