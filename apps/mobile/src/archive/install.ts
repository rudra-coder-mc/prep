import { strFromU8, unzipSync } from 'fflate'
import { readSetting, writeSetting } from '../db/settings'
import type { Database } from '../db/sqlite'
import type { FileStore } from './files'

/**
 * A refresh, from downloaded bytes to an archive the app can read with nothing
 * switched on.
 *
 * See docs/decisions/0033-the-mobile-client-is-offline-first.md for why it is
 * replaced whole, and
 * docs/decisions/0043-the-phone-keeps-content-in-a-file-and-progress-in-sqlite.md
 * for why it stays a directory of files rather than becoming tables.
 */

/** Holds one directory per version, of which exactly one is ever the installed one. */
export const ARCHIVE_ROOT = 'archive'

/** The file the build always writes, and the one that names the version. */
export const CONTENT_FILE = 'content.json'

/**
 * A version is a hex hash, and every version becomes a directory name, so
 * anything that is not one is refused rather than joined onto a path.
 */
const VERSION = /^[A-Za-z0-9._-]+$/

export type InstallOptions = {
  db: Database
  files: FileStore
  bytes: Uint8Array
}

/** Where a given version's files live once it is unpacked. */
export function archivePath(version: string): string {
  return `${ARCHIVE_ROOT}/${version}`
}

/**
 * Unpacks an archive and makes it the one the app reads. Returns the version
 * installed, which comes out of the archive rather than from whoever handed it
 * over.
 *
 * The order is the whole design.
 *
 * Everything that can be refused is refused in memory, before a single file on
 * disk is touched, so a refresh that fails leaves the device holding exactly the
 * archive it was already working from. Then the new version is written into a
 * directory of its own, beside the old one rather than over it, so a phone that
 * runs out of storage halfway still has last week's archive and still works.
 *
 * The swap is then one row: the setting naming the installed version. There is
 * no moment when a directory is half replaced, because no directory is ever
 * replaced. The old one is deleted afterwards, and anything a kill left behind
 * is swept up by the next install rather than kept forever.
 */
export async function installArchive({ db, files, bytes }: InstallOptions): Promise<string> {
  const entries = unpack(bytes)
  const version = versionOf(entries)
  const target = archivePath(version)

  // A directory under this name can only be the remains of an interrupted
  // install of this same version, since the installed one is never overwritten.
  await files.remove(target)
  await write(files, target, entries)

  await writeSetting(db, 'archive-version', version)
  await sweep(files, version)

  return version
}

/** The version installed, or null when nothing has been. */
export async function installedVersion(db: Database): Promise<string | null> {
  return readSetting(db, 'archive-version')
}

/** Where to read the installed archive from, or null when there is none. */
export async function installedPath(db: Database): Promise<string | null> {
  const version = await installedVersion(db)
  return version ? archivePath(version) : null
}

function unpack(bytes: Uint8Array): Record<string, Uint8Array> {
  try {
    // Synchronous because fflate's asynchronous form wants a Worker, which
    // React Native has none of. A refresh is a deliberate act behind a progress
    // indicator, so the second it costs is a second the person asked for.
    return unzipSync(bytes)
  } catch (error) {
    throw new Error(`The archive could not be unpacked: ${describe(error)}`)
  }
}

function versionOf(entries: Record<string, Uint8Array>): string {
  const content = entries[CONTENT_FILE]
  if (!content) throw new Error(`The archive holds no ${CONTENT_FILE}`)

  let parsed: unknown
  try {
    // fflate's own decoder rather than TextDecoder, which Hermes does not
    // declare and React Native does not promise.
    parsed = JSON.parse(strFromU8(content))
  } catch (error) {
    throw new Error(`${CONTENT_FILE} is not readable: ${describe(error)}`)
  }

  const version = (parsed as { version?: unknown } | null)?.version
  if (typeof version !== 'string' || version === '') {
    throw new Error(`${CONTENT_FILE} names no version`)
  }
  if (!VERSION.test(version)) {
    throw new Error(`${CONTENT_FILE} names a version that cannot be a directory: ${version}`)
  }
  return version
}

/**
 * Where a zip entry is allowed to end up.
 *
 * The archive comes from this project's own build over an authenticated
 * connection, so this should never fire. It is here because the cost of being
 * wrong about that is a zip entry named `../../` writing outside the directory
 * the app is allowed to touch, and the check is one line.
 */
function isSafe(name: string): boolean {
  if (name.startsWith('/') || name.includes('\\')) return false
  return !name.split('/').includes('..')
}

async function write(
  files: FileStore,
  target: string,
  entries: Record<string, Uint8Array>,
): Promise<void> {
  const directories = new Set<string>([target])
  for (const name of Object.keys(entries)) {
    if (!isSafe(name)) throw new Error(`The archive holds an entry outside itself: ${name}`)
    const parent = name.slice(0, name.lastIndexOf('/'))
    if (parent) directories.add(`${target}/${parent}`)
  }

  // Shortest first, so a parent is always made before the directory inside it,
  // for a store whose makeDirectory is not recursive.
  for (const directory of [...directories].sort((a, b) => a.length - b.length)) {
    await files.makeDirectory(directory)
  }

  for (const [name, body] of Object.entries(entries)) {
    // A zip records directories as empty entries ending in a slash, and those
    // are made above rather than written as files.
    if (name.endsWith('/')) continue
    await files.writeBytes(`${target}/${name}`, body)
  }
}

/**
 * Deletes every version but the installed one.
 *
 * Ordinarily that is the version just replaced. It is written as a sweep rather
 * than as one delete so that an install killed between the swap and the cleanup
 * costs a few megabytes until the next refresh rather than for good.
 */
async function sweep(files: FileStore, keep: string): Promise<void> {
  for (const name of await files.list(ARCHIVE_ROOT)) {
    if (name !== keep) await files.remove(`${ARCHIVE_ROOT}/${name}`)
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
