/**
 * The narration engine's entry point. Everything outside this directory imports
 * from here.
 *
 * The `server-only` marker sits on this barrel rather than on the parts, which
 * is what lets the tests import them: `server-only` throws on import outside a
 * server module, and that includes a test runner. The parts are node-only in any
 * case, since they read the filesystem, so a client bundle cannot pull the
 * library in through a side door either.
 */
import 'server-only'

export { InvalidScriptError, narrate, type Narration } from './narrate'
export type { Audio } from './audio'
export { readCachedAudio, scriptKey } from './cache'
export { SpeechServiceError } from './piper'
export { MAX_SCRIPT_LENGTH } from './script'
