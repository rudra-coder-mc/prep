/**
 * The browser side of the narration engine: a script in, playable audio out.
 *
 * Everything expensive happens on the server, which synthesises a script once
 * and serves it from a cache after that. This only has to ask, and to fail in a
 * way the player can say something about.
 */
export class NarrationUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NarrationUnavailableError'
  }
}

const GENERIC_FAILURE = 'The voice is not available right now.'

export async function fetchNarrationAudio(script: string, signal?: AbortSignal): Promise<Blob> {
  let response: Response
  try {
    response = await fetch('/api/speech', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: script }),
      signal,
    })
  } catch (error) {
    // An aborted request is the player moving on, not a failure to report.
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new NarrationUnavailableError(GENERIC_FAILURE)
  }

  if (!response.ok) {
    throw new NarrationUnavailableError(await reasonFrom(response))
  }

  return response.blob()
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
