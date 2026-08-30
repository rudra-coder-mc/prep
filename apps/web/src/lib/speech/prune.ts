import { readdir, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { cacheDirectory } from './cache'
import { spokenScriptKeys } from './spoken-content'

/**
 * Deleting the recordings nothing asks for any more.
 *
 * Audio is made when it is asked for and kept forever after, so the cache only
 * grows: every script edited leaves its old recording behind, playable by
 * nothing, because the words that addressed it have changed. This is the other
 * half of that bargain. See
 * docs/decisions/0029-audio-is-synthesised-when-it-is-asked-for.md.
 *
 * Nothing here is dangerous to get wrong in one direction. A recording deleted
 * by mistake costs the wait to make it again, which is why the rule is a plain
 * one: a file whose name is a key `content/` still hashes to stays, and a file
 * that is not a recording at all is not this command's business.
 *
 * Both formats count. Recordings are Opus now, but a cache that has not been
 * transcoded yet is full of WAV, and pruning has to run first so the transcode
 * is not spent on files nothing points at. See
 * docs/decisions/0036-recordings-are-stored-compressed.md.
 */
const RECORDING = /^([0-9a-f]{64})\.(wav|opus)$/

export type Prune = {
  /** The keys deleted, so the caller can say what went rather than how much. */
  deleted: string[]
  kept: number
}

export async function pruneRecordings(directory = cacheDirectory()): Promise<Prune> {
  const current = await spokenScriptKeys()
  const deleted: string[] = []
  let kept = 0

  for (const file of await listing(directory)) {
    const key = RECORDING.exec(file)?.[1]
    if (key === undefined) continue

    if (current.has(key)) {
      kept += 1
      continue
    }

    await unlink(join(directory, file))
    deleted.push(key)
  }

  return { deleted, kept }
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
