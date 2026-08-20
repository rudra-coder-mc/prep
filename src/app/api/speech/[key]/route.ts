import { auth } from '@/lib/auth'
import { readCachedAudio } from '@/lib/speech'

/** A key is a sha256 digest, and nothing else is allowed to name a cache file. */
const KEY = /^[0-9a-f]{64}$/

/**
 * Serves narration that was built ahead of time.
 *
 * `npm run narration:build` synthesises every script in `content/` once, so by
 * the time anybody presses play the audio is already a file and this is a read.
 * A key that has nothing behind it is a 404 rather than a synthesis: the player
 * falls back to `POST /api/speech`, which builds it and caches it, so a script
 * edited since the last build still plays.
 *
 * The key is the hash of the words, so the bytes behind one can never change and
 * the browser is told to keep them for good.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  const { key } = await params
  if (!KEY.test(key)) return problem(404, 'No narration has that name')

  const audio = await readCachedAudio(key)
  if (!audio) return problem(404, 'That narration has not been built yet')

  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(audio.byteLength),
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Speech-Cache': 'hit',
    },
  })
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status })
}
