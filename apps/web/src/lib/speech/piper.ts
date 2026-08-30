import { isOggOpus, type Audio } from './audio'

/**
 * Client for the speech engine running in the `tts` container, which wraps Piper
 * and compresses what it makes. `services/tts/server.py` is the other side.
 *
 * It speaks one endpoint and nothing else. The voice is baked into the image at
 * build time, so there is nothing to configure at runtime, and the transcode
 * endpoint belongs to the migration script rather than to the app.
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
 * Turns text into Ogg Opus at 32 kbps mono, about 4 KB per second of speech.
 *
 * Piper itself only writes WAV. The engine synthesises and then compresses
 * before it answers, which is why the app needs no encoder of its own. See
 * docs/decisions/0036-recordings-are-stored-compressed.md.
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
  if (!isOggOpus(audio)) {
    throw new SpeechServiceError(
      `Speech service at ${baseUrl} returned something that is not Ogg Opus`,
    )
  }

  return audio
}

/**
 * Turns an uncompressed recording into the same speech as Ogg Opus.
 *
 * This exists for one migration: a cache full of WAV files made before
 * recordings were compressed. A key is the hash of the script and not of the
 * bytes, so the format changes underneath the keys and every one of them
 * survives, which is what makes transcoding cheaper than re-synthesising 23
 * hours of speech. See docs/decisions/0036-recordings-are-stored-compressed.md.
 */
export async function transcode(wav: Uint8Array, baseUrl = speechServiceUrl()): Promise<Audio> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}/transcode`, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav' },
      // Copied for the reason `readCachedAudio` copies: node hands back a
      // Buffer, whose type says its backing store might be shared, and a shared
      // one is not a valid request body.
      body: new Uint8Array(wav),
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
  if (!isOggOpus(audio)) {
    throw new SpeechServiceError(
      `Speech service at ${baseUrl} returned something that is not Ogg Opus`,
    )
  }

  return audio
}
