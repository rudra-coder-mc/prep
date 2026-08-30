import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { contentRoot } from '../loader'
import { LESSON_SOURCES } from './web-sources'
import { contentVersion, hashSources } from './version'

describe('hashSources', () => {
  let dir = ''

  beforeEach(async () => {
    dir = await mkdtemp(path.join(tmpdir(), 'archive-version-'))
    await mkdir(path.join(dir, 'topic'), { recursive: true })
    await writeFile(path.join(dir, 'topic', 'meta.ts'), 'export const meta = {}')
    await writeFile(path.join(dir, 'topic', 'lesson.mdx'), '## One')
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('is the same for the same files', async () => {
    expect(await hashSources([dir])).toBe(await hashSources([dir]))
  })

  it('changes when a file changes', async () => {
    const before = await hashSources([dir])
    await writeFile(path.join(dir, 'topic', 'lesson.mdx'), '## Two')
    expect(await hashSources([dir])).not.toBe(before)
  })

  it('changes when a file is added', async () => {
    const before = await hashSources([dir])
    await writeFile(path.join(dir, 'topic', 'questions.ts'), 'export const questions = []')
    expect(await hashSources([dir])).not.toBe(before)
  })

  it('changes when a file is renamed, so a moved topic is a new version', async () => {
    const before = await hashSources([dir])
    await rm(path.join(dir, 'topic', 'meta.ts'))
    await writeFile(path.join(dir, 'topic', 'meta2.ts'), 'export const meta = {}')
    expect(await hashSources([dir])).not.toBe(before)
  })

  it('does not depend on the order the sources are named in', async () => {
    const second = path.join(dir, 'other')
    await mkdir(second)
    await writeFile(path.join(second, 'a.css'), 'body {}')
    expect(await hashSources([dir, second])).toBe(await hashSources([second, dir]))
  })

  it('hashes a file named directly as well as a directory', async () => {
    const file = path.join(dir, 'topic', 'lesson.mdx')
    const before = await hashSources([file])
    await writeFile(file, '## Changed')
    expect(await hashSources([file])).not.toBe(before)
  })

  it('ignores a test file, which cannot change what a lesson page renders', async () => {
    const before = await hashSources([dir])
    await writeFile(path.join(dir, 'topic', 'thing.test.ts'), 'it("works", () => {})')
    expect(await hashSources([dir])).toBe(before)
  })

  it('ignores a directory that does not exist rather than failing the build', async () => {
    await expect(hashSources([path.join(dir, 'nothing')])).resolves.toMatch(/^[0-9a-f]{16}$/)
  })
})

describe('contentVersion', () => {
  it('is a short hex string, so it reads in a log and a URL', async () => {
    expect(await contentVersion()).toMatch(/^[0-9a-f]{16}$/)
  })

  it('is stable across calls', async () => {
    expect(await contentVersion()).toBe(await contentVersion())
  })

  /**
   * A lesson page is built from the visual components and the component map as
   * well as from the curriculum, so a change to either has to be a new version.
   * Without this, editing a visual would leave every device showing the pages
   * built before it, forever, with nothing to say so.
   */
  it('counts the lesson components, not only the curriculum', async () => {
    expect(await contentVersion()).not.toBe(await hashSources([contentRoot()]))
  })

  it('is built from sources that all exist', async () => {
    for (const source of LESSON_SOURCES) {
      expect(existsSync(source), `${source} is named as a lesson source but is not there`).toBe(
        true,
      )
    }
  })
})
