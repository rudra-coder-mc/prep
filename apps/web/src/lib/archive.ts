import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { ARCHIVE_FILE, archiveDirectory } from '@prep/content/archive/location'
import { readManifest, type ArchiveManifest } from '@prep/content/archive/manifest'

/**
 * Reading the content archive, which is the only thing the server does with it.
 *
 * `npm run content:archive` writes it, on the host and outside any deployment,
 * so a device is served whatever the last build left rather than something
 * assembled per request. That is deliberate: the version a device is told about
 * and the bytes it downloads then come out of the same build. See
 * docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md.
 *
 * This imports the archive's leaf modules rather than its barrel, because the
 * barrel reaches for esbuild and MDX to build a lesson page and none of that
 * belongs in a running server.
 */

export type OpenArchive = {
  manifest: ArchiveManifest
  /** The size of the file being sent, which is the only honest Content-Length. */
  bytes: number
  body: ReadableStream<Uint8Array>
}

/** What the last build says it wrote, or null when there is nothing to serve. */
export function readArchiveManifest(): Promise<ArchiveManifest | null> {
  return readManifest(archiveDirectory())
}

/**
 * The artefact, ready to send. Null when nothing has been built, and null when
 * the manifest is there and the file it names is not.
 */
export async function openArchive(): Promise<OpenArchive | null> {
  const directory = archiveDirectory()
  const manifest = await readManifest(directory)
  if (!manifest) return null

  const file = path.join(directory, ARCHIVE_FILE)
  let bytes: number
  try {
    bytes = (await stat(file)).size
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }

  return {
    manifest,
    bytes,
    body: Readable.toWeb(createReadStream(file)) as ReadableStream<Uint8Array>,
  }
}
