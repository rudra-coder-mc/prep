import type { Audio } from './audio'
import { readCachedAudio, scriptKey, writeCachedAudio } from './cache'
import { synthesise } from './piper'
import { checkScript, MAX_SCRIPT_LENGTH, normaliseScript, type ScriptProblem } from '@prep/core'

export class InvalidScriptError extends Error {
  readonly problem: ScriptProblem

  constructor(problem: ScriptProblem, message: string) {
    super(message)
    this.name = 'InvalidScriptError'
    this.problem = problem
  }
}

export type Narration = {
  audio: Audio
  /** The content address of the script, and the cache file's name. */
  key: string
  source: 'cache' | 'engine'
}

/**
 * Keys currently being synthesised, so a second request for one joins the work
 * rather than starting it again.
 *
 * Audio is now made when it is asked for rather than ahead of a build, and the
 * listener is warmed ahead of, so the same recording really is asked for twice
 * at once: the player fetching the next section while the reader skips to it.
 * The engine is one container and a section costs it the better part of a
 * minute, so the duplicate is worth the map.
 */
const inFlight = new Map<string, Promise<Audio>>()

async function synthesiseOnce(key: string, script: string): Promise<Audio> {
  const existing = inFlight.get(key)
  if (existing) return existing

  const work = synthesise(normaliseScript(script))
    .then(async (audio) => {
      await writeCachedAudio(key, audio)
      return audio
    })
    // Cleared however it ends, so a failure leaves nothing behind to join and
    // the next request is a real retry.
    .finally(() => inFlight.delete(key))

  inFlight.set(key, work)
  return work
}

/**
 * The whole narration engine: a script in, playable audio out, synthesised at
 * most once.
 */
export async function narrate(script: string): Promise<Narration> {
  const problem = checkScript(script)
  if (problem === 'empty') {
    throw new InvalidScriptError(problem, 'A narration script cannot be empty')
  }
  if (problem === 'too-long') {
    throw new InvalidScriptError(
      problem,
      `A narration script is spoken one section at a time, and a section cannot be longer than ${MAX_SCRIPT_LENGTH} characters`,
    )
  }

  const key = scriptKey(script)

  const cached = await readCachedAudio(key)
  if (cached) return { audio: cached, key, source: 'cache' }

  return { audio: await synthesiseOnce(key, script), key, source: 'engine' }
}
