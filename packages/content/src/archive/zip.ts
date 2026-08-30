import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { zip } from 'fflate'
import { ARCHIVE_FILE } from './location'

/**
 * The archive as one file, which is how a device takes it.
 *
 * It is replaced whole rather than in parts, so it travels whole: a device that
 * had fetched the questions of one version and the lesson pages of another would
 * be holding something nothing downstream could detect. One file also means an
 * interrupted refresh is simply an absent file rather than a directory somebody
 * has to reason about. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 *
 * Written by the build rather than assembled per request, so the server only
 * ever reads: the bytes a device downloads and the version it was told about
 * come out of the same build.
 */
export async function writeArchiveZip(directory: string, files: string[]): Promise<number> {
  const entries: Record<string, Uint8Array> = {}
  for (const file of files) {
    entries[file] = await readFile(path.join(directory, file))
  }

  const packed = await new Promise<Uint8Array>((resolve, reject) => {
    // Level 9: the archive is built once and downloaded over a phone
    // connection, so the seconds belong on this side of the wire.
    zip(entries, { level: 9 }, (error, data) => (error ? reject(error) : resolve(data)))
  })

  await writeFile(path.join(directory, ARCHIVE_FILE), packed)
  return packed.byteLength
}
