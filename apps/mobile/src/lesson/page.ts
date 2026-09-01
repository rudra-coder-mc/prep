import type { ArchiveTopic } from '@prep/content/archive/types'
import type { FileStore } from '../archive/files'
import { installedPath } from '../archive/install'
import type { Database } from '../db/sqlite'

/**
 * Finding the pre-rendered page of a topic on this device.
 *
 * The archive says where a topic's page is and the build wrote it there, so the
 * path is never guessed. It is still checked: an archive from a build that
 * failed partway would leave a topic whose page is not there, and a WebView
 * pointed at a file that does not exist shows an empty screen and says nothing.
 */

/** Where a topic's page sits, relative to the store's root. */
export function lessonPath(archiveDirectory: string, topic: ArchiveTopic): string {
  return `${archiveDirectory}/${topic.lesson}`
}

/** The path to open, or null when this device holds no page for the topic. */
export async function lessonOnDevice(
  db: Database,
  files: FileStore,
  topic: ArchiveTopic,
): Promise<string | null> {
  const directory = await installedPath(db)
  if (!directory) return null

  const path = lessonPath(directory, topic)
  return (await files.exists(path)) ? path : null
}
