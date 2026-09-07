import { existsSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'

/**
 * Where the archive is, and what a build calls the things in it.
 *
 * A leaf on purpose. The build reaches for esbuild and MDX, and the server that
 * serves what the build wrote must not, so the web app imports this and
 * ./manifest and never the barrel that would pull a compiler in behind them.
 */

/** Everything a build ever writes at the top level of the archive. */
export const CONTENT_FILE = 'content.json'
export const MANIFEST_FILE = 'manifest.json'
export const LESSONS_DIR = 'lessons'
/** The artefact a device downloads: everything above, in one file. */
export const ARCHIVE_FILE = 'archive.zip'

/**
 * The repository root, found by walking up for the lockfile only a workspace
 * root has. The build runs from the root and the app runs from apps/web, and
 * both have to mean the same directory by "the archive".
 *
 * See task 39 in TASKS.md.
 */
export function workspaceRoot(from = process.cwd()): string {
  let dir = from
  for (;;) {
    if (existsSync(join(dir, 'package-lock.json'))) return dir
    const parent = dirname(dir)
    if (parent === dir) throw new Error('no package-lock.json above ' + from)
    dir = parent
  }
}

/**
 * Where `npm run content:archive` writes and where the server reads.
 *
 * In the stack this is a bind mount, named by CONTENT_ARCHIVE_DIR, because the
 * build runs on the host and the app serves what it made. Outside it, one
 * directory at the repository root that git ignores. The default is anchored
 * rather than relative for the reason the recording cache's is: a path relative
 * to the working directory would give the build and the app one each. See
 * docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md.
 */
export function archiveDirectory(): string {
  const configured = process.env.CONTENT_ARCHIVE_DIR
  if (configured) return isAbsolute(configured) ? configured : join(workspaceRoot(), configured)
  return join(workspaceRoot(), '.content-archive')
}
