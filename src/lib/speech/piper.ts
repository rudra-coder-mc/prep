import { isWav, type Audio } from './audio'

/**
 * Client for the Piper HTTP server running in the `tts` container. It speaks a
 * two-endpoint subset of that API and nothing else: everything to do with
 * downloading voices happens at image build time.
 */

export function speechServiceUrl(): string {
  return process.env.SPEECH_SERVICE_URL ?? 'http://tts:5000'
}

export class SpeechServiceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'SpeechServiceError'
  }
}

/**
 * Turns text into a 22050 Hz mono 16 bit WAV, about 44 KB per second of speech.
 *
 * Piper answers with `Content-Type: text/html` even though the body is a WAV,
 * so the content type it reports is ignored and ours is set at the route.
 */
export async function synthesise(text: string, baseUrl = speechServiceUrl()): Promise<Audio> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (error) {
    throw new SpeechServiceError(`Speech service at ${baseUrl} is unreachable`, { cause: error })
  }

  if (!response.ok) {
    throw new SpeechServiceError(
      `Speech service at ${baseUrl} answered ${response.status} ${response.statusText}`,
    )
  }

  const audio = new Uint8Array(await response.arrayBuffer())
  if (!isWav(audio)) {
    throw new SpeechServiceError(
      `Speech service at ${baseUrl} returned something that is not a WAV`,
    )
  }

  return audio
}
