import type { ArchiveContent } from '@prep/content/archive/types'
import type { Database } from '../db/sqlite'
import type { FileStore } from './files'
import { CONTENT_FILE, installedPath } from './install'

/**
 * The curriculum, read off the device.
 *
 * The shape is the build's, imported as a type so that the phone and the archive
 * cannot drift apart without the typecheck saying so. See
 * packages/content/src/archive/data.ts.
 */

/**
 * The whole archive as one object.
 *
 * It is a file rather than a set of tables because it is replaced whole and
 * queried as a whole: the queue reads every enrolled question anyway. Parsing it
 * costs a fraction of a second once per launch, and the caller holds the result
 * for as long as the app runs. See
 * docs/decisions/0043-the-phone-keeps-content-in-a-file-and-progress-in-sqlite.md.
 *
 * The check is shallow. Every topic in here was validated against the content
 * schema by the build that wrote it, so parsing five hundred questions against
 * that schema again would prove nothing and cost the launch. What is worth
 * checking is that this is an archive at all.
 */
export async function readArchiveContent(db: Database, files: FileStore): Promise<ArchiveContent> {
  const directory = await installedPath(db)
  const raw = directory ? await files.readText(`${directory}/${CONTENT_FILE}`) : null
  if (raw === null) throw new Error('This device holds no content yet. Refresh to download it')

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch (error) {
    throw new Error(
      `The content on this device is not readable: ${error instanceof Error ? error.message : String(error)}`,
    )
  }

  if (!isArchive(parsed)) {
    throw new Error('The content on this device is not an archive. Refresh to replace it')
  }

  return parsed
}

function isArchive(value: unknown): value is ArchiveContent {
  if (typeof value !== 'object' || value === null) return false
  const { version, technologies, topics } = value as Record<string, unknown>
  return typeof version === 'string' && Array.isArray(technologies) && Array.isArray(topics)
}
