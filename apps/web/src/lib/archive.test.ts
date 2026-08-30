import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { openArchive, readArchiveManifest } from './archive'

/**
 * The reading half of the archive, which is all the server ever does with it.
 * Building it is a content operation that runs on the host, so everything here
 * is about what is on disk by the time a device asks.
 */
let directory = ''

const MANIFEST = {
  version: 'd26e2e8417e4bed2',
  topics: 46,
  questions: 563,
  exercises: 92,
  narrationSections: 291,
  files: ['content.json'],
  archive: { file: 'archive.zip', bytes: 9 },
}

const ZIP = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 1, 2, 3, 4, 5])

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'prep-archive-lib-'))
  vi.stubEnv('CONTENT_ARCHIVE_DIR', directory)
})

afterEach(async () => {
  await rm(directory, { recursive: true, force: true })
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

async function build({ manifest = true, zip = true } = {}) {
  if (manifest) await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(MANIFEST))
  if (zip) await writeFile(path.join(directory, 'archive.zip'), ZIP)
}

describe('readArchiveManifest', () => {
  it('reads the manifest the build left in the configured directory', async () => {
    await build()

    expect(await readArchiveManifest()).toEqual(MANIFEST)
  })

  it('is null when no archive has been built', async () => {
    expect(await readArchiveManifest()).toBeNull()
  })
})

describe('openArchive', () => {
  it('opens the artefact and reports what the manifest says is in it', async () => {
    await build()

    const opened = await openArchive()

    expect(opened?.manifest.version).toBe(MANIFEST.version)
    expect(opened?.bytes).toBe(ZIP.byteLength)
    expect(new Uint8Array(await new Response(opened!.body).arrayBuffer())).toEqual(ZIP)
  })

  it('is null when no archive has been built', async () => {
    expect(await openArchive()).toBeNull()
  })

  /**
   * The build writes the artefact before the manifest, so this is a directory
   * somebody has emptied by hand rather than a build caught halfway. Either way
   * there is nothing to send, and a Content-Length taken from the manifest over
   * a body that does not exist is worse than saying so.
   */
  it('is null when the manifest names an artefact that is not there', async () => {
    await build({ zip: false })

    expect(await openArchive()).toBeNull()
  })

  /** The file on disk is the body, so it is the only honest Content-Length. */
  it('measures the file rather than believing the manifest', async () => {
    await build({ manifest: false })
    await writeFile(
      path.join(directory, 'manifest.json'),
      JSON.stringify({ ...MANIFEST, archive: { file: 'archive.zip', bytes: 999_999 } }),
    )

    expect((await openArchive())?.bytes).toBe(ZIP.byteLength)
  })
})
