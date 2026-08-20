import { createHash } from 'node:crypto'

/**
 * Piper synthesises at roughly three and a half times real time, so this cap is
 * about fifty seconds of work for three minutes of speech. It is a bound on one
 * request, not on a narration: a script is spoken a section at a time, and a
 * section long enough to hit this is too long to listen to in one go.
 */
export const MAX_SCRIPT_LENGTH = 3000

/**
 * Line breaks and indentation are how the script is written, not how it is
 * spoken, so they collapse away before anything hashes or synthesises the text.
 * Punctuation is left alone because Piper phrases on it.
 *
 * The same normalised string is both the cache key's input and the text sent to
 * the engine, so two scripts that share a key always share their audio.
 */
export function normaliseScript(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export type ScriptProblem = 'empty' | 'too-long'

/** Rejects what the engine cannot speak. Empty text makes Piper itself throw. */
export function checkScript(text: string): ScriptProblem | null {
  const normalised = normaliseScript(text)
  if (normalised.length === 0) return 'empty'
  if (normalised.length > MAX_SCRIPT_LENGTH) return 'too-long'
  return null
}

/**
 * Content addressed: the same words always land on the same file, and editing a
 * script leaves its old audio behind rather than serving it.
 *
 * The voice is deliberately not part of the key. It is baked into the engine
 * image at build time, so a cache directory belongs to one voice; changing the
 * voice means rebuilding that image and discarding the volume. See
 * docs/decisions/0015-piper-narration-engine.md.
 */
export function scriptKey(text: string): string {
  return createHash('sha256').update(normaliseScript(text), 'utf8').digest('hex')
}
