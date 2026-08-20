import type { NarrationSection } from '@/content/schema'

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

/**
 * A narration section together with the address of its built audio. The key is
 * the hash of the script, so the page computes it on the server rather than
 * hashing the same words again in the browser.
 */
export type SpokenSection = NarrationSection & { key: string }

export type NarrationRequest = {
  /**
   * The address of the pre-built recording, when the page knows it. Every script
   * in `content/` is built by `npm run narration:build`, so this is the path
   * playback normally takes.
   */
  key?: string
  signal?: AbortSignal
}

/**
 * Asks for a section's audio: the built file first, synthesis only if there
 * isn't one.
 *
 * A missing key is not an error worth showing. It means the script has been
 * edited since the last build, or never built, and the endpoint below will make
 * the recording and keep it - so the fallback is silent by design and every play
 * after it takes the fast path.
 */
export async function fetchNarrationAudio(
  script: string,
  { key, signal }: NarrationRequest = {},
): Promise<Blob> {
  if (key) {
    const prebuilt = await fetchPrebuilt(key, signal)
    if (prebuilt) return prebuilt
  }

  return synthesise(script, signal)
}

/** The built recording, or null for any reason at all, which means "synthesise". */
async function fetchPrebuilt(key: string, signal?: AbortSignal): Promise<Blob | null> {
  let response: Response
  try {
    response = await fetch(`/api/speech/${key}`, { signal })
  } catch (error) {
    if (isAbort(error)) throw error
    return null
  }

  // Anything other than the audio - a 404, an expired session, a proxy's error
  // page - is left to the synthesis request to run into and report properly,
  // rather than reported twice in two different ways.
  return response.ok ? response.blob() : null
}

async function synthesise(script: string, signal?: AbortSignal): Promise<Blob> {
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
