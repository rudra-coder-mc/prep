import { auth } from '@/lib/auth'
import {
  answerScriptFor,
  hasCachedAudio,
  scriptFor,
  scriptKey,
  SpeechServiceError,
  warmRecording,
  type Warmed,
} from '@/lib/speech'

/** A key is a sha256 digest, and nothing else is allowed to name a cache file. */
const KEY = /^[0-9a-f]{64}$/

/**
 * Makes a recording before anybody presses play, and sends nothing back.
 *
 * Synthesis is 25 to 60 seconds for a section, which is the wait decision `0029`
 * set out to hide by making audio ahead of the listener rather than ahead of a
 * build. This is the door for that. A caller fires it and forgets it: there is
 * nothing here to wait for, and the play that follows a recording that got made
 * is a file read.
 *
 * A recording is named one of two ways, because they are addressed differently:
 *
 * - `{ "narration": "<key>" }` for anything the browser already holds the key
 *   of, which is every lesson section and every question prompt.
 * - `{ "answer": { "topic": "...", "question": "..." } }` for a question's
 *   answer, whose key is not allowed on the page until the answer has been
 *   given. The server resolves it from the question instead.
 *
 * Nothing about the recording comes back either way. The reply is a 204, with
 * `X-Speech-Warm` saying what became of the request: `kept` when the recording
 * was already there, `recorded` when this made it, and `superseded` when a newer
 * warm arrived first. Only one recording is made at a time, because Piper
 * saturates the machine and speculative work must not be in a reader's way.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) return problem(401, 'Sign in first')

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return problem(400, 'Expected a JSON body')
  }

  const asked = target(body)
  if (!asked) return problem(400, 'Expected a "narration" key or an "answer" question')

  const script = await resolve(asked)
  if (!script) return problem(404, 'There is nothing to record under that name')

  if (await hasCachedAudio(scriptKey(script))) return warmed('kept')

  try {
    return warmed(await warmRecording(script))
  } catch (error) {
    if (error instanceof SpeechServiceError) {
      // The engine runs alongside the app, so it not answering is a broken
      // stack. Nobody is waiting on this, so it is logged and nothing else:
      // whoever presses play will be told properly.
      console.error(error)
      return problem(502, 'The voice is not available right now.')
    }
    throw error
  }
}

type Target = { narration: string } | { topic: string; question: string }

/** What the body asks for, or null when it asks for nothing this understands. */
function target(body: unknown): Target | null {
  if (typeof body !== 'object' || body === null) return null

  const { narration, answer } = body as { narration?: unknown; answer?: unknown }

  if (typeof narration === 'string') {
    return KEY.test(narration) ? { narration } : null
  }

  if (typeof answer === 'object' && answer !== null) {
    const { topic, question } = answer as { topic?: unknown; question?: unknown }
    if (typeof topic === 'string' && typeof question === 'string') return { topic, question }
  }

  return null
}

function resolve(asked: Target): Promise<string | null> {
  return 'narration' in asked
    ? scriptFor(asked.narration)
    : answerScriptFor(asked.topic, asked.question)
}

function warmed(outcome: 'kept' | Warmed): Response {
  return new Response(null, { status: 204, headers: { 'X-Speech-Warm': outcome } })
}

/**
 * A refusal here is about the state of the machine rather than about the
 * request, in the same way `GET /api/speech/<key>` refuses: a script edited a
 * moment ago, or an engine that is down. Nothing about a warm is worth storing.
 */
function problem(status: number, error: string): Response {
  return Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })
}
