import type { ArchiveContent } from '@prep/content/archive/types'
import type { FileStore } from '../archive/files'

/**
 * Where a track's recordings live on the device, and which ones a track needs.
 *
 * Audio is not in the archive. It is two orders of magnitude larger than the
 * curriculum and the phone's storage is the constraint, so it arrives a track at
 * a time as one file per key and is kept beside the archive rather than inside
 * it. Replacing the archive therefore does not throw the library away: a key is
 * the hash of the words, so a script that did not change keeps its recording
 * across a refresh.
 */

/** One directory for every track's recordings, since a key already names one. */
export const AUDIO_ROOT = 'audio'

/** A key is a sha256 digest, and nothing else is allowed to name a file. */
const KEY = /^[0-9a-f]{64}$/

/** The extension the cache uses, so a file on the phone is the file on the server. */
const EXTENSION = '.opus'

/**
 * Where a recording sits, relative to the store's root.
 *
 * The keys come from this project's own archive, so the guard should never
 * fire. It is here because the cost of being wrong is a key that walks out of
 * the directory the app is allowed to write in, and the check is one line.
 */
export function recordingPath(key: string): string {
  if (!KEY.test(key)) throw new Error(`That is not a recording key: ${key}`)
  return `${AUDIO_ROOT}/${key}${EXTENSION}`
}

/**
 * Every recording a track needs, in the order it reads: each topic's narration
 * first, then the prompt and the answer of each of its questions.
 *
 * Deduplicated, because one script read by two topics is one key and one file.
 */
export function trackAudioKeys(content: ArchiveContent, technology: string): string[] {
  const keys: string[] = []
  const seen = new Set<string>()

  const add = (key: string) => {
    if (seen.has(key)) return
    seen.add(key)
    keys.push(key)
  }

  for (const topic of content.topics) {
    if (topic.technology !== technology) continue

    for (const section of topic.narration ?? []) add(section.audioKey)
    for (const question of topic.questions) {
      add(question.promptAudioKey)
      add(question.answerAudioKey)
    }
  }

  return keys
}

/** The keys this device holds a recording for, out of the ones asked about. */
export async function heldRecordings(files: FileStore, keys: string[]): Promise<Set<string>> {
  // One directory listing rather than one existence check per key, because a
  // track is thousands of keys and the answer is the same either way.
  const held = new Set(
    (await files.list(AUDIO_ROOT))
      .filter((name) => name.endsWith(EXTENSION))
      .map((name) => name.slice(0, -EXTENSION.length)),
  )

  return new Set(keys.filter((key) => held.has(key)))
}

/** How much of the device's storage the given recordings take. */
export async function heldBytes(files: FileStore, keys: Iterable<string>): Promise<number> {
  let bytes = 0
  for (const key of keys) bytes += (await files.size(recordingPath(key))) ?? 0
  return bytes
}
