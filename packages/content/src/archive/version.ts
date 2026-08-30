import { createHash } from 'node:crypto'
import { readdir, readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { contentRoot } from '../loader'
import { LESSON_SOURCES } from './web-sources'

/**
 * What a device compares to decide whether to refresh.
 *
 * It is a hash of the files the archive was built from rather than a number
 * somebody remembers to raise, because the thing that must never happen is a
 * device holding an archive it believes is current. A forgotten version bump is
 * exactly that, and it fails silently and for as long as nobody notices. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 */

/** Long enough that a collision is not a thing to think about, short enough to read. */
const VERSION_LENGTH = 16

/** Files that are outputs or noise rather than sources. */
const IGNORED = new Set(['node_modules', '.DS_Store', 'tsconfig.tsbuildinfo'])

/**
 * Tests sit beside the components they cover and never reach a page, so counting
 * them would send every device to refetch the archive over an edit that cannot
 * change a single byte of it.
 */
const NOT_A_SOURCE = /\.test\.[jt]sx?$/

/** Every file under a path, relative to it, sorted so the walk order cannot matter. */
async function filesUnder(root: string): Promise<string[]> {
  const found: string[] = []

  async function walk(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (IGNORED.has(entry.name) || NOT_A_SOURCE.test(entry.name)) continue
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) await walk(path.join(dir, entry.name), relative)
      else found.push(relative)
    }
  }

  await walk(root, '')
  return found.sort()
}

/**
 * One hash over several files and directories.
 *
 * The name goes into the hash beside the contents, so renaming a topic is a new
 * version even though every byte in it is unchanged. A source that is not there
 * is skipped rather than throwing: the caller names what a lesson page is built
 * from, and one of those being absent is a build failure that says so far more
 * clearly than a hash that refuses to be computed.
 */
export async function hashSources(sources: string[]): Promise<string> {
  const hash = createHash('sha256')

  for (const source of [...sources].sort()) {
    let entry
    try {
      entry = await stat(source)
    } catch {
      continue
    }

    const files = entry.isDirectory() ? await filesUnder(source) : [path.basename(source)]
    const base = entry.isDirectory() ? source : path.dirname(source)

    for (const file of files) {
      hash.update(file, 'utf8')
      hash.update(await readFile(path.join(base, file)))
    }
  }

  return hash.digest('hex').slice(0, VERSION_LENGTH)
}

/**
 * The version of what `content/` and the lesson components currently say.
 *
 * The lesson sources are in it because a lesson page is built from them too: a
 * change to a visual component renders every lesson differently, and a device
 * holding the old pages would show the old ones forever.
 */
export async function contentVersion(): Promise<string> {
  return hashSources([contentRoot(), ...LESSON_SOURCES])
}
