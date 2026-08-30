import { zipSync } from 'fflate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { migrate } from '../db/migrate'
import { createTestDatabase } from '../../test-support/database'
import { ServerError, type ServerClient } from '../server/client'
import { installedVersion } from './install'
import { refreshArchive } from './refresh'
import { createTestFileStore } from '../../test-support/file-store'

/**
 * The one exchange that replaces the curriculum.
 *
 * A refresh asks before it downloads, because the answer is a megabyte over a
 * phone connection and the version is the whole of the decision. See
 * docs/decisions/0041-a-device-reads-the-archive-the-build-wrote.md.
 */
let db: ReturnType<typeof createTestDatabase>
let files: Awaited<ReturnType<typeof createTestFileStore>>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
  files = await createTestFileStore()
})

const encoder = new TextEncoder()

function archiveOf(version: string): Uint8Array {
  return zipSync({
    'content.json': encoder.encode(JSON.stringify({ version, technologies: [], topics: [] })),
  })
}

function clientFor(version: string, downloaded = version): ServerClient {
  return {
    signIn: vi.fn(),
    checkSession: vi.fn(),
    archiveVersion: vi.fn(async () => ({
      version,
      bytes: 100,
      topics: 1,
      questions: 1,
      exercises: 0,
      narrationSections: 0,
    })),
    downloadArchive: vi.fn(async () => archiveOf(downloaded)),
  } as unknown as ServerClient
}

describe('refreshing the content', () => {
  it('downloads and installs when the device holds nothing', async () => {
    const client = clientFor('v1')

    expect(await refreshArchive({ db, files, client })).toEqual({
      kind: 'installed',
      version: 'v1',
      previous: null,
    })
    expect(await installedVersion(db)).toBe('v1')
  })

  it('replaces an older archive and says what it replaced', async () => {
    await refreshArchive({ db, files, client: clientFor('v1') })

    expect(await refreshArchive({ db, files, client: clientFor('v2') })).toEqual({
      kind: 'installed',
      version: 'v2',
      previous: 'v1',
    })
  })

  // The version is a hash of the files the archive was built from, so equal
  // versions mean equal archives and a megabyte that need not be spent.
  it('downloads nothing when the version has not moved', async () => {
    await refreshArchive({ db, files, client: clientFor('v1') })

    const client = clientFor('v1')
    expect(await refreshArchive({ db, files, client })).toEqual({ kind: 'current', version: 'v1' })
    expect(client.downloadArchive).not.toHaveBeenCalled()
  })

  /**
   * A rebuild between asking and downloading hands over an archive the device
   * never asked for, and the URL cannot tell the two apart. What arrived is
   * still one whole build, so it is installed under the version it carries
   * rather than under the version that was asked for.
   */
  it('records what arrived rather than what was asked for', async () => {
    const result = await refreshArchive({ db, files, client: clientFor('v1', 'v2') })

    expect(result).toEqual({ kind: 'installed', version: 'v2', previous: null })
    expect(await installedVersion(db)).toBe('v2')
  })

  it('leaves the failure to the caller when the server cannot be reached', async () => {
    const client = clientFor('v1')
    client.archiveVersion = vi.fn(async () => {
      throw new ServerError('offline', 'work could not be reached')
    })

    await expect(refreshArchive({ db, files, client })).rejects.toBeInstanceOf(ServerError)
    expect(await installedVersion(db)).toBeNull()
  })
})
