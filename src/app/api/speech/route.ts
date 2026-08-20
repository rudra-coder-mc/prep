import { auth } from '@/lib/auth'
import { InvalidScriptError, narrate, SpeechServiceError } from '@/lib/speech'

/**
 * Turns a narration script into audio.
 *
 * `POST { "text": "..." }` answers with a WAV body, `X-Speech-Cache` saying
 * whether it had been synthesised before, and `X-Speech-Key` naming the cache
 * entry so a slow response can be traced to a file.
 *
 * The script arrives in the body rather than the query string because a section
 * of narration is longer than a URL should be.
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
      // The engine is a separate container, and it is off unless somebody is
      // recording, so this is a gateway failure rather than a bug in this
      // request. Almost always it means the script was edited after the last
      // build, so the message names the command rather than the container.
      console.error(error)
      return problem(
        502,
        'This section has no recording yet. Run npm run narration:build to make one.',
      )
    }
    throw error
  }
}

function problem(status: number, error: string): Response {
  return Response.json({ error }, { status })
}
