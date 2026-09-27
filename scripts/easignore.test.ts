import fs from 'node:fs'
import path from 'node:path'
import ignoreFactory from 'ignore'
import { describe, expect, it } from 'vitest'

/**
 * `.easignore` is the only thing standing between the curriculum and Expo, and
 * a mistake in it is silent: the build succeeds either way and nothing on the
 * phone looks different. So the rule it enforces is asserted here rather than
 * read and believed.
 *
 * This reproduces what eas-cli does rather than approximating it. The source is
 * `vcs/local.js` and `vcs/clients/git.js` in eas-cli 16.32.0, which build the
 * archive in two passes:
 *
 *   1. a shallow clone of this repository, from which files matching
 *      `.easignore` are deleted, and whose `.git` is deleted only if
 *      `.easignore` names it with no default rules applied
 *   2. a copy of the working tree, filtered by `.easignore` plus a default
 *      `.git` and `node_modules`
 *
 * The second pass is the one people picture, and the first is the one that
 * leaks: a shallow clone carries every file of the commit it was cut from, so
 * `.git` surviving means the whole curriculum ships inside a pack file with
 * every visible rule obeyed. See docs/decisions/0038-expo-is-the-one-hosted-service.md.
 */

const root = path.join(import.meta.dirname, '..')
const easignore = fs.readFileSync(path.join(root, '.easignore'), 'utf-8')

/** eas-cli's Ignore, which layers a default over the file. */
function ignores(defaultIgnore: string) {
  const layers = [ignoreFactory().add(defaultIgnore), ignoreFactory().add(easignore)]
  return (relativePath: string) => layers.some((layer) => layer.ignores(relativePath))
}

/** `Ignore.createForCheckingAsync`: no defaults. Decides the clone's fate. */
const ignoresForChecking = ignores('')
/** `Ignore.createForCopyingAsync`: `.git` and `node_modules` are always out. */
const ignoresForCopying = ignores('\n.git\nnode_modules\n')

/** Nothing under these may leave the machine in an EAS build. `agent.md` is the rule. */
const forbidden = [
  'packages/content/content',
  '.content-archive',
  '.content-archive-e2e',
  '.speech-cache',
  '.speech-cache-e2e',
  '.env',
  '.env.local',
]

describe('.easignore', () => {
  it('keeps the shallow clone out of the archive', () => {
    // The bare string, which is how eas-cli asks. A trailing slash fails this
    // and passes everything else, which is what makes it worth a test.
    expect(ignoresForChecking('.git')).toBe(true)
  })

  it('keeps the curriculum, the recordings and the secrets out', () => {
    for (const entry of forbidden) {
      expect(ignoresForCopying(entry), `${entry} would be uploaded`).toBe(true)
    }
  })

  it('still uploads what the app is built from', () => {
    const needed = [
      'package.json',
      'package-lock.json',
      'apps/mobile/package.json',
      'apps/mobile/app.json',
      'apps/mobile/app/index.tsx',
      'apps/mobile/src/sync/sync.ts',
      'apps/web/package.json',
      'packages/core/package.json',
      'packages/core/src/index.ts',
      'packages/content/package.json',
      'packages/content/src/archive/bridge.ts',
    ]
    for (const entry of needed) {
      expect(ignoresForCopying(entry), `${entry} would be left out`).toBe(false)
    }
  })

  it('uploads nothing from a forbidden directory that is on this disk', () => {
    // The rules above are what the file says. This is what the file does to the
    // tree as it stands, which is the question the build actually asks.
    const leaked: string[] = []
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const relative = path.relative(root, path.join(dir, entry.name))
        if (ignoresForCopying(relative)) continue
        if (entry.isDirectory()) walk(path.join(dir, entry.name))
        else if (forbidden.some((f) => relative === f || relative.startsWith(`${f}/`)))
          leaked.push(relative)
      }
    }
    walk(root)
    expect(leaked).toEqual([])
  })
})
