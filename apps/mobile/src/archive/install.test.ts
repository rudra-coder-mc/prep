import { zipSync } from 'fflate'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { migrate } from '../db/migrate'
import { createTestDatabase } from '../../test-support/database'
import { createTestFileStore } from '../../test-support/file-store'
import { ARCHIVE_ROOT, archivePath, installArchive, installedVersion } from './install'

/**
 * Unpacking a refresh.
 *
 * The archive is replaced whole rather than in parts, so what these check is
 * that a device is never left holding half of one. A refresh that fails is a
 * device still holding the archive it had, because that one still works with
 * nothing switched on and half of a newer one would not. See
 * docs/decisions/0033-the-mobile-client-is-offline-first.md.
 */
let db: ReturnType<typeof createTestDatabase>
let files: Awaited<ReturnType<typeof createTestFileStore>>

beforeEach(async () => {
  db = createTestDatabase()
  await migrate(db)
  files = await createTestFileStore()
})

afterEach(() => db?.close())

const encoder = new TextEncoder()

function archive(version: string, extra: Record<string, string> = {}): Uint8Array {
  const entries: Record<string, Uint8Array> = {
    'content.json': encoder.encode(JSON.stringify({ version, technologies: [], topics: [] })),
    'lessons/javascript/closures.html': encoder.encode('<h1>Closures</h1>'),
    'lessons/assets/javascript__closures-ABC123.js': encoder.encode('export default 1'),
  }
  for (const [name, body] of Object.entries(extra)) entries[name] = encoder.encode(body)
  return zipSync(entries, { level: 0 })
}

const NOT_AN_ARCHIVE = encoder.encode('a sign-in page, not an archive')

describe('installing an archive', () => {
  it('writes every entry, nested directories included', async () => {
    await installArchive({ db, files, bytes: archive('v1') })

    expect(await files.readText(`${archivePath('v1')}/lessons/javascript/closures.html`)).toBe(
      '<h1>Closures</h1>',
    )
    expect(
      await files.readText(`${archivePath('v1')}/lessons/assets/javascript__closures-ABC123.js`),
    ).toBe('export default 1')
  })

  /**
   * The version inside the archive rather than the one the version endpoint
   * gave, because a rebuild between asking and downloading hands over a
   * different archive and nothing in the URL can tell them apart.
   */
  it('records the version the archive itself carries', async () => {
    const version = await installArchive({ db, files, bytes: archive('v2') })

    expect(version).toBe('v2')
    expect(await installedVersion(db)).toBe('v2')
  })

  it('leaves only the installed version on disk', async () => {
    await installArchive({ db, files, bytes: archive('v1', { 'lessons/gone.html': 'old' }) })
    await installArchive({ db, files, bytes: archive('v2') })

    expect(await files.list(ARCHIVE_ROOT)).toEqual(['v2'])
    expect(await installedVersion(db)).toBe('v2')
  })

  /**
   * The swap is a settings row rather than a rename, so an install killed
   * between writing that row and deleting the old version leaks a directory. The
   * next install sweeps it rather than leaving it there for good.
   */
  it('sweeps up a version an interrupted install left behind', async () => {
    await installArchive({ db, files, bytes: archive('v1') })
    await files.makeDirectory(`${ARCHIVE_ROOT}/v0`)

    await installArchive({ db, files, bytes: archive('v2') })

    expect(await files.list(ARCHIVE_ROOT)).toEqual(['v2'])
  })

  it('replaces the remains of an interrupted install of the same version', async () => {
    await files.makeDirectory(archivePath('v1'))
    await files.writeBytes(`${archivePath('v1')}/half-written.html`, encoder.encode('half'))

    await installArchive({ db, files, bytes: archive('v1') })

    expect(await files.exists(`${archivePath('v1')}/half-written.html`)).toBe(false)
    expect(await files.exists(`${archivePath('v1')}/content.json`)).toBe(true)
  })
})

describe('refusing an archive', () => {
  it('refuses bytes that are not a zip', async () => {
    await expect(installArchive({ db, files, bytes: NOT_AN_ARCHIVE })).rejects.toThrow(
      /could not be unpacked/,
    )
    expect(await installedVersion(db)).toBeNull()
  })

  it('refuses an archive with no content file in it', async () => {
    const bytes = zipSync({ 'lessons/javascript/closures.html': encoder.encode('<h1>hi</h1>') })

    await expect(installArchive({ db, files, bytes })).rejects.toThrow(/content\.json/)
    expect(await installedVersion(db)).toBeNull()
  })

  it('refuses a content file that names no version', async () => {
    const bytes = zipSync({ 'content.json': encoder.encode(JSON.stringify({ topics: [] })) })

    await expect(installArchive({ db, files, bytes })).rejects.toThrow(/version/)
    expect(await installedVersion(db)).toBeNull()
  })

  /**
   * The version becomes a directory name, so it is checked before it is joined
   * onto a path. This should never fire: the archive comes from this project's
   * own build over an authenticated connection. It is one line, and being wrong
   * about that writes outside the directory the app is allowed to touch.
   */
  it('refuses a version that is not a name', async () => {
    const bytes = zipSync({
      'content.json': encoder.encode(JSON.stringify({ version: '../../elsewhere' })),
    })

    await expect(installArchive({ db, files, bytes })).rejects.toThrow(/cannot be a directory/)
    expect(await files.list(ARCHIVE_ROOT)).toEqual([])
  })

  it('refuses an entry that would be written outside the archive', async () => {
    const bytes = zipSync({
      'content.json': encoder.encode(JSON.stringify({ version: 'v1' })),
      '../escaped.html': encoder.encode('<h1>elsewhere</h1>'),
    })

    await expect(installArchive({ db, files, bytes })).rejects.toThrow(/outside itself/)
    expect(await installedVersion(db)).toBeNull()
  })

  /**
   * The whole point of the ordering. A refresh is checked in memory before
   * anything on disk is touched, so a phone that has been working offline for a
   * week does not lose that by being handed a bad answer once.
   */
  it('leaves the archive it already had exactly as it was', async () => {
    await installArchive({ db, files, bytes: archive('v1') })

    await expect(installArchive({ db, files, bytes: NOT_AN_ARCHIVE })).rejects.toThrow()

    expect(await installedVersion(db)).toBe('v1')
    expect(await files.readText(`${archivePath('v1')}/lessons/javascript/closures.html`)).toBe(
      '<h1>Closures</h1>',
    )
  })
})

describe('what a device believes it holds', () => {
  it('holds nothing before the first refresh', async () => {
    expect(await installedVersion(db)).toBeNull()
  })
})
