import { auth } from '@/lib/auth'
import { InvalidScriptError, narrate, SpeechServiceError } from '@/lib/speech'

/**
 * Turns a script that `content/` does not own into audio.
 *
 * `POST { "text": "..." }` answers with a WAV body, `X-Speech-Cache` saying
 * whether it had been synthesised before, and `X-Speech-Key` naming the cache
 * entry so a slow response can be traced to a file. The script arrives in the
 * body rather than the query string because a section of narration is longer
 * than a URL should be.
 *
 * Nothing in the interface asks for audio this way. A page sends a key and
 * `GET /api/speech/<key>` resolves it against the content on this side, which is
 * what keeps a question's answer out of the browser. This is the engine's own
 * door: it is how the speech specs put arbitrary words through it without
 * borrowing a lesson's.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  let text: unknown
  try {
    text = (await request.json())?.text
  } catch {
    return problem(400, 'Expected a JSON body')
  }

  if (typeof text !== 'string') return problem(400, 'Expected a "text" string')

  try {
    const narration = await narrate(text)

    return new Response(narration.audio, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(narration.audio.byteLength),
        // Audio is already cached on the server by content, and a POST is not
        // cacheable by the browser anyway. Saying so keeps proxies out of it.
        'Cache-Control': 'no-store',
        'X-Speech-Cache': narration.source === 'cache' ? 'hit' : 'miss',
        'X-Speech-Key': narration.key,
      },
    })
  } catch (error) {
    if (error instanceof InvalidScriptError) return problem(400, error.message)
    if (error instanceof SpeechServiceError) {
      // The engine is a separate container running alongside the app, so it not
      // answering is a broken stack rather than a bug in this request, and
      // there is nothing the reader could run to fix it.
      console.error(error)
      return problem(502, 'The voice is not available right now.')
    }
    throw error
  }
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status })
}
