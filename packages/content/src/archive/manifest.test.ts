import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MANIFEST_FILE } from './location'
import { readManifest } from './manifest'

let directory = ''

const VALID = {
  version: 'd26e2e8417e4bed2',
  topics: 46,
  questions: 563,
  exercises: 92,
  narrationSections: 291,
  files: ['content.json'],
  archive: { file: 'archive.zip', bytes: 934_000 },
}

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'prep-manifest-'))
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
  vi.restoreAllMocks()
})

async function write(manifest: unknown) {
  await writeFile(path.join(directory, MANIFEST_FILE), JSON.stringify(manifest))
}

describe('readManifest', () => {
  it('reads what a build wrote', async () => {
    await write(VALID)

    expect(await readManifest(directory)).toEqual(VALID)
  })

  it('is null when nothing has been built, which is a state and not a failure', async () => {
    expect(await readManifest(directory)).toBeNull()
  })

  /**
   * A manifest is a promise that the archive beside it can be served. Half of
   * one is a version a device would be told about and then handed nothing for,
   * so it is treated as no archive at all rather than trusted in part.
   */
  it('refuses a manifest that is incomplete, rather than serving half of one', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await write({ version: 'abc', topics: 46 })

    expect(await readManifest(directory)).toBeNull()
  })

  it('refuses a manifest that is not JSON, which is what a partial write leaves', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    await writeFile(path.join(directory, MANIFEST_FILE), '{"version": "abc"')

    expect(await readManifest(directory)).toBeNull()
  })
})
