import { beforeEach, describe, expect, it, vi } from 'vitest'
import { auth } from '@/lib/auth'
import { readArchiveManifest } from '@/lib/archive'
import { GET } from './route'

vi.mock('@/lib/auth', () => ({ auth: { api: { getSession: vi.fn() } } }))
vi.mock('@/lib/archive', () => ({ readArchiveManifest: vi.fn() }))

const getSession = vi.mocked(auth.api.getSession)
const manifest = vi.mocked(readArchiveManifest)

const MANIFEST = {
  version: 'd26e2e8417e4bed2',
  topics: 46,
  questions: 563,
  exercises: 92,
  narrationSections: 291,
  files: ['content.json', 'lessons/javascript/closures.html'],
  archive: { file: 'archive.zip', bytes: 934_000 },
}

function get() {
  return GET(new Request('http://localhost/api/device/archive/version'))
}

beforeEach(() => {
  vi.clearAllMocks()
  getSession.mockResolvedValue({ user: { id: 'u1' } } as never)
  manifest.mockResolvedValue(MANIFEST)
})

describe('GET /api/device/archive/version', () => {
  it('answers with the version a device compares against and the size of the download', async () => {
    const response = await get()

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      version: 'd26e2e8417e4bed2',
      bytes: 934_000,
      topics: 46,
      questions: 563,
      exercises: 92,
      narrationSections: 291,
    })
  })

  /**
   * The check runs on every launch and the answer changes whenever the archive
   * is rebuilt, so a device that cached this would stop refreshing.
   */
  it('is never cached', async () => {
    expect((await get()).headers.get('Cache-Control')).toBe('no-store')
  })

  /**
   * Nobody has run the build on this machine. A device can do nothing about it
   * and must not read it as "you are up to date", which is what any 2xx would
   * mean and what would leave it holding an old archive forever.
   */
  it('says it has nothing to serve when no archive has been built', async () => {
    manifest.mockResolvedValue(null)

    const response = await get()

    expect(response.status).toBe(503)
    expect((await response.json()).error).toMatch(/archive/i)
  })

  it('refuses a request with no session, without reading the archive', async () => {
    getSession.mockResolvedValue(null as never)

    expect((await get()).status).toBe(401)
    expect(manifest).not.toHaveBeenCalled()
  })
})
