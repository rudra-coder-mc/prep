import { auth } from '@/lib/auth'
import { narrate, readCachedAudio, scriptFor, SpeechServiceError, type Audio } from '@/lib/speech'

/** A key is a sha256 digest, and nothing else is allowed to name a cache file. */
const KEY = /^[0-9a-f]{64}$/

/**
 * Plays a recording, making it first if nobody has asked for these words before.
 *
 * The key is the hash of the script, so a recording is looked up as a file and
 * the reply is immutable for good. A key with nothing behind it is resolved
 * against `content/` on this side of the wire and synthesised: the browser sends
 * a key and never a script, which is what keeps a question's answer off the page
 * until it has been given. Only a key no script hashes to is a 404.
 *
 * See docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string }> },
): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  const { key } = await params
  if (!KEY.test(key)) return problem(404, 'No narration has that name')

  // Read first, so the ordinary case is a file and never a walk of content.
  const recorded = await readCachedAudio(key)
  if (recorded) return wav(recorded, 'hit')

  const script = await scriptFor(key)
  if (!script) return problem(404, 'No narration has that name')

  try {
    const narration = await narrate(script)
    return wav(narration.audio, narration.source === 'cache' ? 'hit' : 'miss')
  } catch (error) {
    if (error instanceof SpeechServiceError) {
      // The engine runs alongside the app, so it not answering is a broken
      // stack rather than anything the reader did or can fix.
      console.error(error)
      return problem(502, 'The voice is not available right now.')
    }
    throw error
  }
}

function wav(audio: Audio, cache: 'hit' | 'miss'): Response {
  return new Response(audio, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(audio.byteLength),
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Speech-Cache': cache,
    },
  })
}

/**
 * A refusal here is about the state of the machine rather than about the key: a
 * script edited a moment ago, or an engine that is down. Stored without a header
 * saying otherwise, a 404 is heuristically cacheable, and a browser that saw one
 * would go on reporting it after the recording existed.
 */
function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
