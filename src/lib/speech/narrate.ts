import type { Audio } from './audio'
import { readCachedAudio, scriptKey, writeCachedAudio } from './cache'
import { synthesise } from './piper'
import { checkScript, MAX_SCRIPT_LENGTH, normaliseScript, type ScriptProblem } from './script'

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
 * The whole narration engine: a script in, playable audio out, synthesised at
 * most once.
 *
 * Two identical requests arriving together will both miss and both synthesise,
 * and the second one to finish wins. Wasteful rather than wrong, and with one
 * listener it is not worth an in-flight registry to prevent.
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

  const audio = await synthesise(normaliseScript(script))
  await writeCachedAudio(key, audio)

  return { audio, key, source: 'engine' }
}
