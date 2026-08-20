import { randomUUID } from 'node:crypto'
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { Audio } from './audio'

/**
 * Synthesis is the expensive part - about a second of CPU for every three and a
 * half seconds of speech - and a narration script changes far less often than it
 * is played, so audio is written once and read from disk forever after.
 *
 * In the stack this is a named volume. Outside it, a directory beside the
 * repository that git ignores.
 */
export function cacheDirectory(): string {
  return process.env.SPEECH_CACHE_DIR ?? '.speech-cache'
}

function audioPath(directory: string, key: string): string {
  return join(directory, `${key}.wav`)
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
