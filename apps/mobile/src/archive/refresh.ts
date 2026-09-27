import type { Database } from '../db/sqlite'
import type { ServerClient } from '../server/client'
import type { FileStore } from './files'
import { installArchive, installedVersion } from './install'
import { readArchiveContent } from './content'
import { enrolAllLearned } from '../library/learn'
import { replayAttemptedQuestions } from '../sync/sync'
import { pruneAudioLibrary } from '../audio/library'

/**
 * A refresh: replacing the curriculum the device holds with the one the server
 * built.
 *
 * It asks for the version before it asks for the archive, because the version is
 * a hash of the files the archive was built from and comparing it is the whole
 * of the decision. The alternative is a megabyte over a phone connection every
 * launch. See docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md.
 *
 * Nothing here catches anything. A refresh is started by the device and is never
 * required, so an unreachable server is the caller's to shrug at.
 */
export type RefreshResult =
  | { kind: 'installed'; version: string; previous: string | null }
  | { kind: 'current'; version: string }

export async function refreshArchive({
  db,
  files,
  client,
}: {
  db: Database
  files: FileStore
  client: ServerClient
}): Promise<RefreshResult> {
  const available = await client.archiveVersion()
  const held = await installedVersion(db)
  if (held === available.version) return { kind: 'current', version: held }

  // Under the version the archive carries rather than the one just asked for. A
  // rebuild in between hands over a different archive, and that archive is still
  // one whole build, so it is installed as what it is.
  const version = await installArchive({ db, files, bytes: await client.downloadArchive() })

  const content = await readArchiveContent(db, files)
  await enrolAllLearned(db, content)
  await replayAttemptedQuestions(db, content)
  await pruneAudioLibrary(files, content)

  return { kind: 'installed', version, previous: held }
}
