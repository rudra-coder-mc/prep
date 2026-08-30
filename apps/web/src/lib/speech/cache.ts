import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { access, mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'
import type { Audio } from './audio'
import { normaliseScript } from '@prep/core'

/**
 * The repository root, found by walking up for the lockfile only a workspace
 * root has. The app runs from apps/web and the scripts run from the root, and
 * both have to reach the same recordings.
 */
export function workspaceRoot(): string {
  let dir = process.cwd()
  for (;;) {
    if (existsSync(join(dir, 'package-lock.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) return process.cwd()
    dir = parent
  }
}

/**
 * Synthesis is the expensive part, about a second of CPU for every three and a
 * half seconds of speech, and a narration script changes far less often than it
 * is played, so audio is written once and read from disk forever after.
 *
 * In the stack this is a named volume, named by SPEECH_CACHE_DIR. Outside it,
 * one directory at the repository root that git ignores: the default is
 * anchored rather than relative, because there is one place recordings live and
 * a path relative to the working directory would make three. See
 * docs/decisions/0022-one-place-for-recordings.md.
 */
export function cacheDirectory(): string {
  const configured = process.env.SPEECH_CACHE_DIR
  if (configured) return isAbsolute(configured) ? configured : join(workspaceRoot(), configured)
  return join(workspaceRoot(), '.speech-cache')
}

/**
 * How a script is addressed. Content addressed, so the same words always land on
 * the same file, editing a script leaves its old audio behind rather than
 * serving it, and moving a script between topics reuses what was synthesised.
 *
 * The voice is deliberately not part of the key. It is baked into the engine
 * image at build time, so a cache directory belongs to one voice; changing the
 * voice means rebuilding that image and discarding the volume. See
 * docs/decisions/0015-piper-narration-engine.md.
 */
export function scriptKey(text: string): string {
  return createHash('sha256').update(normaliseScript(text), 'utf8').digest('hex')
}

function audioPath(directory: string, key: string): string {
  return join(directory, `${key}.wav`)
}

/**
 * Whether a key already has a recording, without reading it.
 *
 * Warming asks this rather than reading, because the answer it wants is "does
 * this exist" and a section is a few megabytes. Loading one into memory to find
 * out is most of the cost of warming a topic nobody listens to.
 */
export async function hasCachedAudio(key: string, directory = cacheDirectory()): Promise<boolean> {
  try {
    await access(audioPath(directory, key))
    return true
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

/** The cached audio for a key, or null when nothing has been synthesised yet. */
export async function readCachedAudio(
  key: string,
  directory = cacheDirectory(),
): Promise<Audio | null> {
  try {
    // node hands back a Buffer, whose type says its backing store might be
    // shared. Copying into a plain array is what makes it a response body.
    return new Uint8Array(await readFile(audioPath(directory, key)))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

/**
 * Writes to a unique temporary name and renames it into place, so a reader
 * never opens a half-written file and two writers racing on the same key both
 * end up with a complete one.
 */
export async function writeCachedAudio(
  key: string,
  audio: Audio,
  directory = cacheDirectory(),
): Promise<void> {
  await mkdir(directory, { recursive: true })

  const temporary = join(directory, `${key}.${randomUUID()}.part`)
  await writeFile(temporary, audio)

  try {
    await rename(temporary, audioPath(directory, key))
  } catch (error) {
    // The rename failure is what the caller needs to see, so a failure to clean
    // up after it must not replace it. The leftover is a `.part` file.
    await unlink(temporary).catch(() => undefined)
    throw error
  }
}
