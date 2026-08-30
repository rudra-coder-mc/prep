import { auth } from '@/lib/auth'
import { readCachedAudio } from '@/lib/speech'

/** A key is a sha256 digest, and nothing else is allowed to name a cache file. */
const KEY = /^[0-9a-f]{64}$/

/**
 * A recording, for a device downloading a track ahead of a journey.
 *
 * It never synthesises, which is the one thing separating it from
 * `GET /api/speech/<key>`. A phone holds every key in the archive and asks for
 * the ones it lacks, so a track that had never been recorded would arrive here
 * as hundreds of requests, each a minute of the machine's whole attention.
 * `npm run narration:build` makes them ahead of time, and what is missing is
 * reported rather than made. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 *
 * One recording is one file, so an interrupted download of a track needs no
 * resume logic: what arrived stays, and the next attempt asks for the rest.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  const { key } = await params
  if (!KEY.test(key)) return problem(404, 'No recording has that name')

  const audio = await readCachedAudio(key)
  if (!audio) {
    return problem(404, 'That has not been recorded yet. Build the track and ask again')
  }

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/ogg',
      'Content-Length': String(audio.byteLength),
      // The key is the hash of the words, so the bytes behind one never change.
      'Cache-Control': 'private, max-age=31536000, immutable',
    },
  })
}

/**
 * A miss here is about the state of the machine rather than about the key: the
 * track has not been recorded yet, and it will be. Stored without a header
 * saying otherwise a 404 is heuristically cacheable, and a device that saw one
 * would go on reporting a recording missing after it had been made.
 */
function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
