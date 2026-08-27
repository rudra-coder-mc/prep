import type { NarrationSection } from '@/content/schema'

/**
 * The browser side of the narration engine: a key in, playable audio out.
 *
 * Everything expensive happens on the server, which turns a key back into the
 * script it addresses and synthesises it the first time anybody asks. This only
 * has to ask, and to fail in a way the player can say something about.
 */
export class NarrationUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NarrationUnavailableError'
  }
}

const GENERIC_FAILURE = 'The voice is not available right now.'

/**
 * A narration section as the player receives it: the key of its recording, and
 * none of the words. The key is the hash of the script, so the page computes it
 * on the server and the script itself never has to be sent anywhere.
 */
export type SpokenSection = Omit<NarrationSection, 'script'> & { key: string }

/**
 * Asks for a section's audio. One request, whether the recording exists yet or
 * has to be made, because the server can resolve the key on its own.
 */
export async function fetchNarrationAudio(key: string, signal?: AbortSignal): Promise<Blob> {
  let response: Response
  try {
    response = await fetch(`/api/speech/${key}`, { signal })
  } catch (error) {
    // An aborted request is the player moving on, not a failure to report.
    if (isAbort(error)) throw error
    throw new NarrationUnavailableError(GENERIC_FAILURE)
  }

  if (!response.ok) {
    throw new NarrationUnavailableError(await reasonFrom(response))
  }

  return response.blob()
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

/**
 * The endpoint says why it refused, in JSON. Anything else that arrives with an
 * error status is not worth showing a reader verbatim.
 */
async function reasonFrom(response: Response): Promise<string> {
  if (response.status === 401) return 'Your session has expired. Sign in again to listen.'

  try {
    const body = await response.json()
    return typeof body?.error === 'string' ? body.error : GENERIC_FAILURE
  } catch {
    return GENERIC_FAILURE
  }
}
