import { existsSync } from 'node:fs'
import path from 'node:path'

/**
 * Every file a lesson page is built from other than the lesson itself.
 *
 * Most of them are in `apps/web`. A lesson is authored once and rendered on both
 * surfaces, so the archive bundles the same MDX component map, the same visual
 * components and the same narration marking the web app renders with, rather
 * than copies of them. That is what stops a lesson looking like two different
 * lessons, and it is the reason the paths point at the app instead of at
 * something this package owns.
 *
 * It is the wrong direction for a dependency and it is deliberate: it buys one
 * copy of the visuals for the price of one file to change. If the lesson
 * rendering surface ever moves into a package of its own, this module is the
 * whole of the change. See
 * docs/decisions/0039-the-archive-bundles-the-web-apps-lesson-components.md.
 */

/**
 * The workspace root, found by walking up for the lockfile only the root has.
 * The same walk the recording cache does, and for the same reason: the scripts
 * run from the root and the tests run from wherever vitest was started.
 */
function workspaceRoot(): string {
  let dir = process.cwd()
  for (;;) {
    if (existsSync(path.join(dir, 'package-lock.json'))) return dir
    const parent = path.dirname(dir)
    if (parent === dir) throw new Error('no package-lock.json above ' + process.cwd())
    dir = parent
  }
}

const ROOT = workspaceRoot()

/** What `@/...` means to esbuild, matching the web app's own alias. */
export const WEB_SOURCE_ROOT = path.join(ROOT, 'apps', 'web', 'src')

/** The MDX component map, which decides what a lesson's markup renders as. */
export const MDX_COMPONENTS = path.join(WEB_SOURCE_ROOT, 'mdx-components.tsx')

/** The animated components a lesson is written against. */
export const VISUALS_DIR = path.join(WEB_SOURCE_ROOT, 'components', 'visuals')

/** The theme and base rules the lesson pages are styled by. */
export const GLOBAL_CSS = path.join(WEB_SOURCE_ROOT, 'app', 'globals.css')

/** The walk that marks the section of a lesson the narration is on. */
export const NARRATED_SECTION = path.join(
  WEB_SOURCE_ROOT,
  'components',
  'speech',
  'narrated-section.ts',
)

/**
 * This package's own: what a page runs, and the bridge it opens to the app.
 * They are here so that LESSON_SOURCES is the whole of what builds a page.
 */
const ARCHIVE_DIR = path.join(ROOT, 'packages', 'content', 'src', 'archive')
export const LESSON_RUNTIME = path.join(ARCHIVE_DIR, 'lesson-runtime.tsx')
const LESSON_BRIDGE = [
  path.join(ARCHIVE_DIR, 'lesson-bridge.ts'),
  path.join(ARCHIVE_DIR, 'bridge.ts'),
]

/**
 * Everything above, as the list the content version hashes. A lesson page is
 * built from the curriculum and from these, so a change to either is a new
 * version and a device refreshes.
 */
export const LESSON_SOURCES = [
  MDX_COMPONENTS,
  VISUALS_DIR,
  GLOBAL_CSS,
  NARRATED_SECTION,
  LESSON_RUNTIME,
  ...LESSON_BRIDGE,
]

export { ROOT as WORKSPACE_ROOT }
