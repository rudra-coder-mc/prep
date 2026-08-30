import { readdir, readFile, stat, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { cacheDirectory, hasCachedAudio, writeCachedAudio } from './cache'
import { transcode } from './piper'

/**
 * Turning a cache of uncompressed recordings into a cache of Opus ones.
 *
 * Recordings used to be WAV, which is about 44 KB for every second of speech.
 * That was free while the only reader was a browser on the same machine as the
 * files, and stops being free the moment a phone has to hold the library. See
 * docs/decisions/0036-recordings-are-stored-compressed.md.
 *
 * Every key survives, because a key is the hash of the script and not of the
 * bytes. So this is a format change underneath a set of names that do not move,
 * and the 23 hours of speech already synthesised are kept.
 *
 * Prune first. A cache holds recordings for scripts that have since been
 * edited, and transcoding those spends the work on files nothing will ever ask
 * for.
 */

const UNCOMPRESSED = /^([0-9a-f]{64})\.wav$/

export type Transcode = {
  /** The keys converted, so a run can say what it did rather than how much. */
  converted: string[]
  /** Keys already compressed by an earlier run, which this one left alone. */
  alreadyCompressed: number
  /** What `converted` weighed before and after, so a resumed run reports its own work. */
  bytesBefore: number
  bytesAfter: number
}

/**
 * Converts one recording at a time and deletes each WAV as it goes, so a run
 * that is interrupted leaves a cache that is part converted rather than a cache
 * that is broken, and running it again finishes the job.
 *
 * One at a time rather than in parallel for the reason warming is: the engine
 * is one container, and saturating it starves the app sharing the machine.
 */
export async function transcodeRecordings(
  directory = cacheDirectory(),
  onProgress?: (key: string, done: number, total: number) => void,
): Promise<Transcode> {
  const uncompressed = (await listing(directory)).flatMap((file) => {
    const key = UNCOMPRESSED.exec(file)?.[1]
    return key === undefined ? [] : [{ file, key }]
  })

  const converted: string[] = []
  let alreadyCompressed = 0
  let bytesBefore = 0
  let bytesAfter = 0

  for (const { file, key } of uncompressed) {
    const wav = join(directory, file)

    // An earlier run that was interrupted between writing the Opus and deleting
    // the WAV leaves both. The recording is already made, so this only has the
    // leftover to clear.
    if (await hasCachedAudio(key, directory)) {
      await unlink(wav)
      alreadyCompressed += 1
      continue
    }

    // Counted here rather than above, so both totals describe the same set of
    // files and a resumed run does not report a saving it did not make.
    bytesBefore += (await stat(wav)).size

    const opus = await transcode(await readFile(wav))
    await writeCachedAudio(key, opus, directory)
    await unlink(wav)

    bytesAfter += opus.byteLength
    converted.push(key)
    onProgress?.(key, converted.length + alreadyCompressed, uncompressed.length)
  }

  return { converted, alreadyCompressed, bytesBefore, bytesAfter }
}

/** An empty cache and a cache that was never made are the same thing here. */
async function listing(directory: string): Promise<string[]> {
  try {
    return await readdir(directory)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []
    throw error
  }
}
